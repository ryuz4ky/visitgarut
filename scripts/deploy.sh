#!/usr/bin/env bash
set -euo pipefail
cd /home/visitgar/public_html
VG_REVISION=$(git rev-parse HEAD)
export PATH="/home/visitgar/.local/share/mise/installs/node/24.21.0/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=384"
npm ci --no-audit --no-fund
npm run build
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
if [ -f /home/visitgar/.visitgarut.pid ]; then
  VG_PID=$(cat /home/visitgar/.visitgarut.pid)
  if [[ "$VG_PID" =~ ^[0-9]+$ ]] && [ -r "/proc/$VG_PID/cmdline" ] && tr '\0' ' ' < "/proc/$VG_PID/cmdline" | grep -q 'next-server'; then kill "$VG_PID" || true; fi
  rm /home/visitgar/.visitgarut.pid
fi
node scripts/daemon.cjs
node - <<'NODE'
(async () => {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:3187/api/health');
      if (response.ok && (await response.json()).database === 'connected') return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.error('Application did not become healthy after restart');
  process.exitCode = 1;
})();
NODE
printf '%s\n' "$VG_REVISION" > /home/visitgar/.visitgarut-deployed-sha
