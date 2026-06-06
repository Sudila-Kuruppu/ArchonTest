import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getSchema } from './schema.js';

const DB_PATH = process.env.DATABASE_PATH || './data/jobscraper.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(getSchema());
  }
  return db;
}

if (process.argv[1] && (process.argv[1].endsWith('connection.ts') || process.argv[1].endsWith('connection.js'))) {
  const d = getDb();
  console.log('Database initialized successfully at', DB_PATH);
  process.exit(0);
}
