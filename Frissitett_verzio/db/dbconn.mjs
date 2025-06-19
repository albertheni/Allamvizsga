import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { config } from 'dotenv';

config(); // .env fájl betöltése

const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // Alapértelmezett: sqlite
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './db/sutivarazs.db';

let db;

if (DB_TYPE === 'sqlite') {
  const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
    if (err) {
      console.error('SQLite kapcsolódási hiba:', err.message);
    } else {
      console.log('Kapcsolódva az SQLite adatbázishoz:', SQLITE_DB_PATH);
    }
  });

  // Promisify az SQLite műveleteket
  sqliteDb.getAsync = promisify(sqliteDb.get).bind(sqliteDb);
  sqliteDb.allAsync = promisify(sqliteDb.all).bind(sqliteDb);
  sqliteDb.runAsync = promisify(sqliteDb.run).bind(sqliteDb);

  db = {
    async execute(query, params = []) {
      if (query.trim().toLowerCase().startsWith('select')) {
        const rows = await sqliteDb.allAsync(query, params);
        return [rows];
      } else {
        const result = await sqliteDb.runAsync(query, params);
        // Ellenőrizzük, hogy a result létezik és kompatibilis
        const lastId = result && typeof result === 'object' && result.lastID !== undefined ? result.lastID : null;
        const affectedRows = result && typeof result === 'object' && result.changes !== undefined ? result.changes : 0;
        return [{
          insertId: lastId,
          affectedRows: affectedRows
        }];
      }
    },
    async getConnection() {
      return {
        execute: this.execute.bind(this),
        beginTransaction: () => Promise.resolve(),
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
        release: () => Promise.resolve(),
      };
    },
  };
} else if (DB_TYPE === 'mysql') {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'sutivarazs_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  db = pool;
} else {
  throw new Error(`Ismeretlen vagy nem támogatott DB_TYPE: ${DB_TYPE}`);
}

export default db;