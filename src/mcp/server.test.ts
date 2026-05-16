import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { migrate } from '../storage/migrate.js';
import { createServer } from './server.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('createServer', () => {
  it('returns McpServer instance', () => {
    const server = createServer(db);
    expect(server).toBeDefined();
  });

  it('does not throw during registration', () => {
    expect(() => createServer(db)).not.toThrow();
  });
});
