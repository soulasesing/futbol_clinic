#!/usr/bin/env bash
set -euo pipefail

backup_path="${1:-}"

if [[ -z "${RESTORE_DATABASE_URL:-}" ]]; then
  echo "RESTORE_DATABASE_URL is required" >&2
  exit 1
fi

if [[ "${RESTORE_CONFIRM:-}" != "restore-futbol-clinic" ]]; then
  echo "Set RESTORE_CONFIRM=restore-futbol-clinic to confirm the restore" >&2
  exit 1
fi

if [[ -z "${backup_path}" || ! -f "${backup_path}" ]]; then
  echo "Usage: scripts/db-restore.sh path/to/backup.dump" >&2
  exit 1
fi

pg_restore --list "${backup_path}" >/dev/null
pg_restore \
  --dbname="${RESTORE_DATABASE_URL}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "${backup_path}"

echo "Restore completed: ${backup_path}"
