# Backup and restore runbook

## Backup

Requirements:

- PostgreSQL client tools compatible with PostgreSQL 15;
- `DATABASE_URL` for a read-capable database role;
- a protected destination not synchronized to the repository.

Run:

```bash
DATABASE_URL='postgresql://...' BACKUP_DIR='/secure/path' ./scripts/db-backup.sh
```

The script creates a custom-format dump and verifies that its catalog can be
read. Application uploads stored outside PostgreSQL must be backed up
separately.

## Restore test

Never test a restore against production. Create an empty isolated database and
run:

```bash
RESTORE_DATABASE_URL='postgresql://.../futbol_clinic_restore' \
RESTORE_CONFIRM='restore-futbol-clinic' \
./scripts/db-restore.sh /secure/path/futbol_clinic_TIMESTAMP.dump
```

After restoring:

1. run the migration status command;
2. verify tenant, user, player, event, attendance, payment and receipt counts;
3. execute cross-tenant access tests;
4. verify private object references and notification configuration;
5. record elapsed time and any manual intervention.

## Initial objectives

- Pilot RPO: 24 hours.
- Pilot RTO: 8 hours.
- General availability target: RPO 1 hour and RTO 4 hours.

Backups are only considered valid after a successful isolated restore.
