import db from './dbconn.mjs';

const isSQLite = process.env.DB_TYPE === 'sqlite';
const createdAtField = isSQLite ? 'created_at' : 'createdAt';
const updatedAtField = isSQLite ? 'updated_at' : 'updatedAt';
const idType = isSQLite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
const textType = isSQLite ? 'TEXT' : 'VARCHAR(255)';

async function initializeDb() {
  try {
    const connection = await db.getConnection();
    console.log('Kapcsolat sikeresen létrehozva:', connection);
    // Recipe tábla
    const [recipeResult] = await connection.execute(`
      CREATE TABLE IF NOT EXISTS Recipe (
        id ${idType},
        nev ${textType} NOT NULL,
        kep ${textType} NOT NULL,
        leiras ${textType} NOT NULL,
        hozzavalok ${textType} NOT NULL,
        keszitesi_utmutato ${textType} NOT NULL,
        elokeszitesi_ido ${textType} NOT NULL,
        sutesi_ido ${textType} NOT NULL,
        adagok_szama ${textType} NOT NULL,
        ${createdAtField} ${textType} NOT NULL,
        ${updatedAtField} ${textType} NOT NULL
      )
    `);
    console.log('Recipe tábla eredmény:', recipeResult);
    // user2 tábla
    const [userResult] = await connection.execute(`
      CREATE TABLE IF NOT EXISTS user2 (
        id ${idType},
        userName ${textType} NOT NULL,
        email ${textType} NOT NULL,
        password ${textType} NOT NULL,
        type ${textType} NOT NULL,
        ${createdAtField} ${textType} NOT NULL,
        ${updatedAtField} ${textType} NOT NULL
      )
    `);
    console.log('user2 tábla eredmény:', userResult);
    connection.release();
    console.log(`${process.env.DB_TYPE} adatbázis inicializálva.`);
  } catch (err) {
    console.error('Adatbázis inicializálási hiba:', err);
  }
}

initializeDb();