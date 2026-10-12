const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inspectProcess}=require('./daemon.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'vg-supervisor-'));
try {
 const app=path.join(root,'app');fs.mkdirSync(app);const p=path.join(root,'123');fs.mkdirSync(p);fs.symlinkSync(app,path.join(p,'cwd'));
 fs.writeFileSync(path.join(p,'stat'),'123 (next-server (test)) S '+Array.from({length:25},(_,i)=>String(i)).join(' '));
 for(const cmd of ['next-server (v15.5.27)\0',`node\0${app}/server.js\0`,'node\0/home/visitgar/public_html/scripts/run-server.cjs\0']){fs.writeFileSync(path.join(p,'cmdline'),cmd);assert.equal(inspectProcess(123,app,root).alive,true);}
 fs.writeFileSync(path.join(p,'cmdline'),'node\0unrelated.js\0');assert.equal(inspectProcess(123,app,root).reason,'pid_identity_mismatch');
 assert.equal(inspectProcess(456,app,root).reason,'process_exited');assert.equal(inspectProcess(0,app,root).alive,false);
 fs.writeFileSync(path.join(p,'cmdline'),'next-server\0');assert.equal(inspectProcess(123,root,root).alive,false);
 fs.writeFileSync(path.join(p,'stat'),'123 (next-server) Z 0');assert.equal(inspectProcess(123,app,root).reason,'zombie');
 console.log('PASS supervisor: startup command, Next.js title, PID identity, missing process and zombie handling');
} finally {fs.rmSync(root,{recursive:true,force:true})}
