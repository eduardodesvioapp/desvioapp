#!/bin/sh
set -e

ENV_CONFIG="/usr/share/nginx/html/env-config.js"

if [ -f "$ENV_CONFIG" ]; then
  sed -i "s|\${VITE_SUPABASE_URL}|${VITE_SUPABASE_URL}|g" "$ENV_CONFIG"
  sed -i "s|\${VITE_SUPABASE_ANON_KEY}|${VITE_SUPABASE_ANON_KEY}|g" "$ENV_CONFIG"
  sed -i "s|\${VITE_R2_WORKER_URL}|${VITE_R2_WORKER_URL}|g" "$ENV_CONFIG"
  sed -i "s|\${VITE_R2_PUBLIC_URL}|${VITE_R2_PUBLIC_URL}|g" "$ENV_CONFIG"
  sed -i "s|\${VITE_CF_ZONE}|${VITE_CF_ZONE}|g" "$ENV_CONFIG"
fi

exec nginx -g "daemon off;"
