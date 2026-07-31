#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

backup_dir="${BACKUP_DIR:-database/backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${backup_dir}/futbol_clinic_${timestamp}.dump"

mkdir -p "${backup_dir}"
pg_dump \
  --dbname="${DATABASE_URL}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${backup_path}"

pg_restore --list "${backup_path}" >/dev/null
echo "Backup created and verified: ${backup_path}"
