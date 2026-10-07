// Run from cPanel cron. Only this account's app is supervised.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');const envFile=path.join(process.env.HOME,'visitgarut.env');
if(!fs.existsSync(envFile)||!fs.existsSync(path.join(root,'.next/standalone/server.js')))process.exit(0);
const pidFile=path.join(process.env.HOME,'.visitgarut.pid');let alive=false;
try{const pid=Number(fs.readFileSync(pidFile,'utf8'));if(pid>0){process.kill(pid,0);alive=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8').includes('next-server')}}catch{}
if(alive)process.exit(0);
const env={...process.env,NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:'3187'};
for(const line of fs.readFileSync(envFile,'utf8').split('\n')){if(!line||line.startsWith('#'))continue;const i=line.indexOf('=');if(i>0)env[line.slice(0,i)]=line.slice(i+1)}
const log=fs.openSync(path.join(process.env.HOME,'visitgarut-app.log'),'a');
const child=cp.spawn(process.execPath,[path.join(root,'.next/standalone/server.js')],{cwd:path.join(root,'.next/standalone'),env,detached:true,stdio:['ignore',log,log]});
fs.writeFileSync(pidFile,String(child.pid),{mode:0o600});child.unref();
