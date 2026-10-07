#!/usr/bin/env bash
set -euo pipefail
cd /home/visitgar/public_html
VG_REVISION=$(git rev-parse HEAD)
export PATH="/home/visitgar/.local/share/mise/installs/node/24.21.0/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=384"
# Build a separate checkout so the running server keeps its current assets.
VG_STAGE=$(mktemp -d /home/visitgar/.visitgarut-build.XXXXXX)
trap 'rm -rf "$VG_STAGE"' EXIT
git archive "$VG_REVISION" | tar -x -C "$VG_STAGE"
cd "$VG_STAGE"
npm ci --no-audit --no-fund
npm run build
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
cd /home/visitgar/public_html
if [ -d .next/static ]; then cp -rn .next/static/. "$VG_STAGE/.next/static/"; cp -rn .next/static/. "$VG_STAGE/.next/standalone/.next/static/"; fi
if [ -f /home/visitgar/.visitgarut.pid ]; then
  VG_PID=$(cat /home/visitgar/.visitgarut.pid)
  if [[ "$VG_PID" =~ ^[0-9]+$ ]] && [ -r "/proc/$VG_PID/cmdline" ] && tr '\0' ' ' < "/proc/$VG_PID/cmdline" | grep -q 'next-server'; then
    kill "$VG_PID" || true
    for VG_TRY in $(seq 1 30); do
      if ! kill -0 "$VG_PID" 2>/dev/null; then break; fi
      sleep 0.2
    done
  fi
  rm /home/visitgar/.visitgarut.pid
fi
VG_PREVIOUS=/home/visitgar/.visitgarut-previous-next
rm -rf "$VG_PREVIOUS"
if [ -d .next ]; then mv .next "$VG_PREVIOUS"; fi
mv "$VG_STAGE/.next" .next
rm -rf .youtube-worker
mv "$VG_STAGE/.youtube-worker" .youtube-worker
node scripts/daemon.cjs
if ! node - <<'NODE'
(async () => {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:3187/api/health');
      if (response.ok && (await response.json()).database === 'connected') return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  process.exitCode = 1;
})();
NODE
then
  if [ -f /home/visitgar/.visitgarut.pid ]; then
    VG_PID=$(cat /home/visitgar/.visitgarut.pid)
    if [[ "$VG_PID" =~ ^[0-9]+$ ]] && [ -r "/proc/$VG_PID/cmdline" ] && tr '\0' ' ' < "/proc/$VG_PID/cmdline" | grep -q 'next-server'; then kill "$VG_PID" || true; fi
    rm /home/visitgar/.visitgarut.pid
  fi
  rm -rf .next
  if [ -d "$VG_PREVIOUS" ]; then mv "$VG_PREVIOUS" .next; fi
  node scripts/daemon.cjs
  echo 'Health check failed; restored the previous application build' >&2
  exit 1
fi
printf '%s\n' "$VG_REVISION" > /home/visitgar/.visitgarut-deployed-sha
rm -rf "$VG_PREVIOUS"
