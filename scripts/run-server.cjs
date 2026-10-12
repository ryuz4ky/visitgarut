// Runs in the standalone build's working directory; stays the same PID as Next.js.
const path = require('node:path');
const fs = require('node:fs');
const logFile = path.join(process.env.HOME, 'visitgarut-app.log');
function log(event, detail={}) {fs.appendFileSync(logFile, JSON.stringify({at:new Date().toISOString(),event,pid:process.pid,...detail})+'\n',{mode:0o600});}
log('server_start');
process.on('exit',code=>log('server_exit',{code}));
process.on('uncaughtExceptionMonitor',error=>log('server_exception',{name:error.name,code:error.code||'unknown'}));
// Next.js installs its own signal shutdown handling.
process.on('SIGTERM',()=>log('server_signal',{signal:'SIGTERM'}));
process.on('SIGINT',()=>log('server_signal',{signal:'SIGINT'}));
require(path.join(process.cwd(),'server.js'));
