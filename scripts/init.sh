#!/usr/bin/env bash
# Session smoke check. Verifies the dev env is healthy before coding.
# Exits 0 on success with a single summary line; exits 1 with a
# step name + fix hint on any failure. Intended to be fast (<5s typical).
set -u

QUIET=0
TYPECHECK=0
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    --typecheck) TYPECHECK=1 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

APP_PID=""
# Always clean up the app we may have started, even if we fail mid-check.
cleanup() {
  if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
    # brief grace period so port 3000 frees before the next run
    sleep 0.3
    kill -9 "$APP_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

log() { [ "$QUIET" -eq 1 ] || echo "  $*"; }

fail() {
  local step="$1" detail="$2" fix="$3"
  echo "✗ harness check failed: $step"
  echo "  $detail"
  echo "  fix: $fix"
  exit 1
}

cd "$(dirname "$0")/.."

# --- 1. Docker services up and healthy ---------------------------------
log "checking docker compose services"
ps_json="$(docker compose ps --format json 2>&1)"
if [ $? -ne 0 ]; then
  fail "docker compose" "$ps_json" "ensure Docker Desktop is running"
fi

# Accept either newline-delimited JSON objects or a single JSON array.
pg_line="$(printf '%s\n' "$ps_json" | grep -E '"Service":"postgres"' || true)"
redis_line="$(printf '%s\n' "$ps_json" | grep -E '"Service":"redis"' || true)"

pg_ok=0
redis_ok=0
# Postgres has a healthcheck; require "healthy". Redis has no healthcheck in
# docker-compose.yml, so "running" is the best signal we have.
printf '%s' "$pg_line"    | grep -q '"Health":"healthy"'                 && pg_ok=1
printf '%s' "$redis_line" | grep -qE '"State":"running"'                 && redis_ok=1

if [ "$pg_ok" -eq 0 ] || [ "$redis_ok" -eq 0 ]; then
  log "starting postgres + redis via docker compose"
  docker compose up -d postgres redis >/dev/null 2>&1 || true
  # poll up to 20s for both to become ready
  for i in $(seq 1 20); do
    sleep 1
    ps_json="$(docker compose ps --format json 2>/dev/null)"
    pg_line="$(printf '%s\n' "$ps_json" | grep -E '"Service":"postgres"' || true)"
    redis_line="$(printf '%s\n' "$ps_json" | grep -E '"Service":"redis"' || true)"
    pg_ok=0; redis_ok=0
    printf '%s' "$pg_line"    | grep -q '"Health":"healthy"' && pg_ok=1
    printf '%s' "$redis_line" | grep -qE '"State":"running"' && redis_ok=1
    [ "$pg_ok" -eq 1 ] && [ "$redis_ok" -eq 1 ] && break
  done
  if [ "$pg_ok" -eq 0 ] || [ "$redis_ok" -eq 0 ]; then
    fail "docker services" \
      "docker compose postgres/redis not healthy after 20s" \
      "docker compose logs postgres redis"
  fi
fi

# --- 2. Postgres reachable on 5432 -------------------------------------
log "checking postgres connectivity"
if command -v pg_isready >/dev/null 2>&1; then
  if ! pg_isready -h localhost -p 5432 -q; then
    fail "postgres" "pg_isready reported unavailable" \
      "Postgres not reachable at localhost:5432 — is docker compose up?"
  fi
else
  if ! bun -e "
    const postgres = (await import('postgres')).default;
    const sql = postgres(process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/dev', { max: 1, idle_timeout: 1 });
    try { await sql\`select 1\`; await sql.end(); } catch (e) { console.error(e.message); process.exit(1); }
  " >/dev/null 2>&1; then
    fail "postgres" "bun postgres probe failed" \
      "Postgres not reachable at localhost:5432 — is docker compose up?"
  fi
fi

# --- 3. Migrations up to date ------------------------------------------
log "checking drizzle migrations"
# `drizzle-kit check` exists in recent versions but may be absent on older ones.
# Only fail when the command is present AND explicitly reports a diff.
if bunx --bun drizzle-kit check --help >/dev/null 2>&1; then
  diff_out="$(bunx --bun drizzle-kit check 2>&1 || true)"
  if echo "$diff_out" | grep -qiE 'collision|conflict|out of sync|mismatch|pending'; then
    fail "migrations" \
      "drizzle-kit check reported issues: $(echo "$diff_out" | tail -3 | tr '\n' ' ')" \
      "Pending migration diff — run: bunx drizzle-kit generate && bunx drizzle-kit migrate"
  fi
else
  log "drizzle-kit check not available — skipping"
fi

# --- 4. Redis reachable ------------------------------------------------
log "checking redis connectivity"
if command -v redis-cli >/dev/null 2>&1; then
  if ! redis-cli -p 6379 ping 2>/dev/null | grep -q PONG; then
    fail "redis" "redis-cli ping did not return PONG" "Redis not reachable on 6379"
  fi
else
  # Bun has built-in Bun.redis (1.2+); use that over adding ioredis.
  if ! bun -e "
    try {
      const c = new Bun.RedisClient('redis://localhost:6379');
      await c.connect();
      const r = await c.send('PING', []);
      if (r !== 'PONG') throw new Error('unexpected: ' + r);
      c.close();
    } catch (e) { console.error(e.message); process.exit(1); }
  " >/dev/null 2>&1; then
    fail "redis" "bun redis probe failed" "Redis not reachable on 6379"
  fi
fi

# --- 5. Env validates --------------------------------------------------
log "checking env validation"
env_err="$(bun -e "await import('./src/config/env')" 2>&1)"
if [ $? -ne 0 ]; then
  fail "env" "$(echo "$env_err" | head -5)" "Check .env against .env.example"
fi

# --- 6. App boots + /health -------------------------------------------
log "checking app boot + /health"
# Boot the app in the background and poll until it listens. We route stdout/err
# to a temp file so a failure can surface something useful.
boot_log="$(mktemp -t harness-init.XXXXXX)"
bun run --silent src/index.ts >"$boot_log" 2>&1 &
APP_PID=$!

booted=0
for i in $(seq 1 25); do
  sleep 0.2
  if curl -sf -o /dev/null http://localhost:3000/health; then
    booted=1
    break
  fi
  # early abort if the process already died
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    break
  fi
done

if [ "$booted" -ne 1 ]; then
  detail="$(tail -5 "$boot_log" 2>/dev/null || true)"
  rm -f "$boot_log"
  fail "app boot" "${detail:-app did not respond on :3000/health within 5s}" \
    "run 'bun run dev' and inspect the error"
fi
rm -f "$boot_log"

# --- 7. Optional typecheck --------------------------------------------
if [ "$TYPECHECK" -eq 1 ]; then
  log "running tsc --noEmit"
  tsc_out="$(bunx tsc --noEmit 2>&1)"
  if [ $? -ne 0 ]; then
    fail "typecheck" "$(echo "$tsc_out" | tail -10)" "fix the type errors reported above"
  fi
fi

echo "✓ harness healthy"
exit 0
