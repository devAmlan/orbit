import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH ?? "data/orbit.db";
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}
