// cPanel's flock serializes invocations. Logs intentionally exclude environment values.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const appDir = path.join(root, '.next/standalone');
const home = process.env.HOME;
const pidFile = path.join(home, '.visitgarut.pid');
const envFile = path.join(home, 'visitgarut.env');
const logFile = path.join(home, 'visitgarut-app.log');
function log(event, detail = {}) {
  fs.appendFileSync(logFile, JSON.stringify({at: new Date().toISOString(), event, ...detail}) + '\n', {mode: 0o600});
}
function inspectProcess(pid, expectedDir, procRoot = '/proc') {
  if (!Number.isSafeInteger(pid) || pid < 2) return {alive:false, reason:'invalid_pid'};
  try {
    const dir = path.join(procRoot, String(pid));
    const command = fs.readFileSync(path.join(dir, 'cmdline'), 'utf8').split('\0');
    const cwd = fs.realpathSync(path.join(dir, 'cwd'));
    const isApp = command.some(arg => /^next-server(?:\s|$)/.test(arg) || arg === path.join(expectedDir, 'server.js') || arg.endsWith('/scripts/run-server.cjs'));
    if (cwd !== expectedDir || !isApp) return {alive:false, reason:'pid_identity_mismatch'};
    const stat = fs.readFileSync(path.join(dir, 'stat'), 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    if (fields[0] === 'Z') return {alive:false, reason:'zombie'};
    return {alive:true, reason:'running', startTicks:fields[19]};
  } catch (error) { return {alive:false, reason:error.code === 'ENOENT' ? 'process_exited' : 'process_unreadable'}; }
}
async function supervise() {
  if (!fs.existsSync(envFile) || !fs.existsSync(path.join(appDir, 'server.js'))) {
    log('supervisor_skip', {reason:'missing_environment_or_build'}); return;
  }
  let pid = 0;
  try {pid = Number(fs.readFileSync(pidFile, 'utf8').trim());} catch {}
  const state = inspectProcess(pid, appDir);
  if (state.alive) {
    let healthy = false;
    try {healthy = (await fetch('http://127.0.0.1:3187/api/health', {signal:AbortSignal.timeout(5000)})).ok;} catch {}
    log('supervisor_observed', {pid, startTicks:state.startTicks, healthy});
    // A database outage must not create an endless restart loop.
    return;
  }
  // A missing PID file must not spawn a competing listener over a healthy app.
  try {
    const response = await fetch('http://127.0.0.1:3187/api/health', {signal:AbortSignal.timeout(2000)});
    if (response.ok) {log('supervisor_skip', {reason:'listener_active_pid_unverified'});return;}
  } catch {}
  const env = {...process.env, NODE_ENV:'production', HOSTNAME:'127.0.0.1', PORT:'3187'};
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const i = line.indexOf('='); if (i>0 && !line.startsWith('#')) env[line.slice(0,i)] = line.slice(i+1);
  }
  const fd = fs.openSync(logFile, 'a', 0o600);
  const child = cp.spawn(process.execPath, [path.join(root,'scripts/run-server.cjs')], {cwd:appDir, env, detached:true, stdio:['ignore',fd,fd]});
  child.once('error', error=>log('supervisor_spawn_error',{code:error.code||'unknown'}));
  if (child.pid) {
    fs.writeFileSync(pidFile, String(child.pid), {mode:0o600});
    log('supervisor_started', {pid:child.pid, previousPid:pid, reason:state.reason});
  }
  fs.closeSync(fd); child.unref();
}
module.exports = {inspectProcess};
if (require.main === module) supervise().catch(error=>{log('supervisor_error',{code:error.code||'unknown'});process.exitCode=1;});
