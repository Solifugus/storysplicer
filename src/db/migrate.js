#!/usr/bin/env node

/**
 * Database migration system
 *
 * Usage:
 *   node src/db/migrate.js         - Run all pending migrations
 *   node src/db/migrate.js up      - Run all pending migrations
 *   node src/db/migrate.js down    - Rollback last migration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient, end } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  const result = await query(
    'SELECT name FROM migrations ORDER BY id ASC'
  );
  return result.rows.map(row => row.name);
}

/**
 * Get list of migration files
 */
async function getMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files
    .filter(f => f.endsWith('.js'))
    .sort();
}

/**
 * Run migrations
 */
async function runMigrations() {
  await ensureMigrationsTable();

  const executedMigrations = await getExecutedMigrations();
  const migrationFiles = await getMigrationFiles();

  const pendingMigrations = migrationFiles.filter(
    file => !executedMigrations.includes(file)
  );

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Running ${pendingMigrations.length} migration(s)...`);

  for (const file of pendingMigrations) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migration = await import(migrationPath);

      await migration.up(client);

      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [file]
      );

      await client.query('COMMIT');
      console.log(`✓ Completed: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`✗ Failed: ${file}`);
      console.error(error);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('All migrations completed successfully');
}

/**
 * Rollback last migration
 */
async function rollbackMigration() {
  await ensureMigrationsTable();

  const result = await query(
    'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const migrationName = result.rows[0].name;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    console.log(`Rolling back migration: ${migrationName}`);
    const migrationPath = path.join(MIGRATIONS_DIR, migrationName);
    const migration = await import(migrationPath);

    await migration.down(client);

    await client.query(
      'DELETE FROM migrations WHERE name = $1',
      [migrationName]
    );

    await client.query('COMMIT');
    console.log(`✓ Rolled back: ${migrationName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Failed to rollback: ${migrationName}`);
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
const command = process.argv[2] || 'up';

try {
  if (command === 'up') {
    await runMigrations();
  } else if (command === 'down') {
    await rollbackMigration();
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Usage: node migrate.js [up|down]');
    process.exit(1);
  }

  await end();
  process.exit(0);
} catch (error) {
  console.error('Migration failed:', error);
  await end();
  process.exit(1);
}
