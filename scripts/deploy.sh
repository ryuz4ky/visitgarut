#!/usr/bin/env bash
set -euo pipefail
cd /home/visitgar/public_html
export PATH="/home/visitgar/.local/share/mise/installs/node/24.21.0/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
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
git rev-parse HEAD > /home/visitgar/.visitgarut-deployed-sha
