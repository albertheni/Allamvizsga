import fs from 'fs'; // Szinkron fs modul
import { unlink } from 'fs/promises'; // Aszinkron unlink
import sqlite3 from 'better-sqlite3';

async function importDatabase() {
  try {
    // Ellenőrizd, hogy létezik-e az adatbázis szinkron módon
    if (fs.existsSync('sutivarazs.db')) {
      await unlink('sutivarazs.db'); // Aszinkron törlés
      console.log('Régi adatbázis törölve.');
    }
    
    const db = new sqlite3('sutivarazs.db', { fileMustExist: false });
    const sql = fs.readFileSync('sutivarazs_db_sqlite.sql', 'utf8'); // Szinkron olvasás
    db.exec(sql);
    console.log('Importálás kész.');
  } catch (error) {
    console.error('Hiba az importálás során:', error.message);
  }
}

importDatabase(); // Futtatás