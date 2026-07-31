import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Pool, PoolClient } from 'pg';

interface MigrationFile {
  version: number;
  filename: string;
  checksum: string;
  sql: string;
}

const databaseUrl = process.env.MIGRATOR_DATABASE_URL || process.env.DATABASE_URL;
const migrationsDirectory = path.resolve(process.cwd(), 'migrations');
const lockName = 'futbol-clinic-schema-migrations';
const legacyVersion = 17;

if (!databaseUrl) {
  throw new Error('MIGRATOR_DATABASE_URL or DATABASE_URL is required');
}

const loadMigrations = async (): Promise<MigrationFile[]> => {
  const filenames = (await fs.readdir(migrationsDirectory))
    .filter((filename) => /^\d{3}_.+\.sql$/.test(filename))
    .sort();

  const migrations = await Promise.all(filenames.map(async (filename) => {
    const version = Number(filename.slice(0, 3));
    const sql = await fs.readFile(path.join(migrationsDirectory, filename), 'utf8');
    return {
      version,
      filename,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    };
  }));

  const versions = new Set<number>();
  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(`Duplicate migration version: ${migration.version}`);
    }
    versions.add(migration.version);
  }
  return migrations;
};

const ensureMigrationTable = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const hasExistingSchema = async (client: PoolClient): Promise<boolean> => {
  const result = await client.query(
    `SELECT to_regclass('public.tenants') IS NOT NULL AS exists`
  );
  return result.rows[0]?.exists === true;
};

const verifyLegacySchema = async (client: PoolClient): Promise<void> => {
  const requiredTables = [
    'tenants', 'users', 'invitations', 'players', 'coaches', 'teams',
    'matches', 'trainings', 'attendance', 'stats', 'categories',
    'player_teams', 'physical_tests', 'match_convocations',
  ];
  const result = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [requiredTables]
  );
  const found = new Set(result.rows.map((row) => row.table_name as string));
  const missing = requiredTables.filter((table) => !found.has(table));
  if (missing.length > 0) {
    throw new Error(`Cannot baseline incomplete legacy schema. Missing: ${missing.join(', ')}`);
  }
};

const baselineLegacyMigrations = async (
  client: PoolClient,
  migrations: MigrationFile[]
): Promise<void> => {
  if (process.env.MIGRATION_BASELINE_LEGACY !== 'true') {
    throw new Error(
      'Existing schema has no migration history. Back it up, verify it, then set MIGRATION_BASELINE_LEGACY=true once.'
    );
  }
  await verifyLegacySchema(client);
  await client.query('BEGIN');
  try {
    for (const migration of migrations.filter((item) => item.version <= legacyVersion)) {
      await client.query(
        `INSERT INTO schema_migrations (version, filename, checksum)
         VALUES ($1, $2, $3)`,
        [migration.version, migration.filename, migration.checksum]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const run = async (): Promise<void> => {
  const migrations = await loadMigrations();
  const migrationPool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await migrationPool.connect();

  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockName]);
    const existingSchema = await hasExistingSchema(client);
    await ensureMigrationTable(client);

    let appliedResult = await client.query(
      'SELECT version, filename, checksum FROM schema_migrations ORDER BY version'
    );
    if (existingSchema && appliedResult.rowCount === 0) {
      await baselineLegacyMigrations(client, migrations);
      appliedResult = await client.query(
        'SELECT version, filename, checksum FROM schema_migrations ORDER BY version'
      );
    }

    const applied = new Map<number, { filename: string; checksum: string }>(
      appliedResult.rows.map((row) => [
        Number(row.version),
        { filename: String(row.filename), checksum: String(row.checksum) },
      ])
    );

    for (const migration of migrations) {
      const previous = applied.get(migration.version);
      if (previous) {
        if (previous.filename !== migration.filename || previous.checksum !== migration.checksum) {
          throw new Error(`Migration ${migration.version} was modified after being applied`);
        }
        continue;
      }

      process.stdout.write(`Applying ${migration.filename}\n`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO schema_migrations (version, filename, checksum)
           VALUES ($1, $2, $3)`,
          [migration.version, migration.filename, migration.checksum]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    process.stdout.write('Migrations are up to date\n');
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockName]).catch(() => undefined);
    client.release();
    await migrationPool.end();
  }
};

void run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Migration failed'}\n`);
  process.exitCode = 1;
});
