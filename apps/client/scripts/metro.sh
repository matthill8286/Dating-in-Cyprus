#!/bin/bash
# Debug JS for the phone. Do not pin REACT_NATIVE_PACKAGER_HOSTNAME — a stale LAN IP
# (hotspot vs Wi-Fi) makes Metro advertise the wrong host, the app "downloads 100%",
# and Hermes dies with `Property 'MessageQueue' doesn't exist`.
set -euo pipefail
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "${IP}" ]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
export EXPO_PUBLIC_API_BASE_URL="http://${IP:-127.0.0.1}:8080"

cd /Users/matthewhill/WebstormProjects/Dating/apps/client
exec ./node_modules/.bin/expo start --host lan --port 8081
