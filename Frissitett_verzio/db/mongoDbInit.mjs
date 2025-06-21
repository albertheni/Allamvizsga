import db from './mongoDbConn.mjs';

async function initializeDb() {
  try {
    console.log('MongoDB inicializálás: A sémák a modellekben vannak definiálva.');
    const connection = await db.getConnection();
    await connection.release();
    console.log('MongoDB adatbázis inicializálva.');
  } catch (err) {
    console.error('MongoDB inicializálási hiba:', err);
  }
}

initializeDb();