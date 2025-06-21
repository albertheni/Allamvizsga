import { mainMenu } from '../helpers/menus.mjs';
import db from '../db/dbconn.mjs'; // Frissített import
import Joi from 'joi';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dinamikus mezőnevek SQLite és MySQL kompatibilitáshoz
const isSQLite = process.env.DB_TYPE === 'sqlite';
const createdAtField = isSQLite ? 'created_at' : 'createdAt';
const updatedAtField = isSQLite ? 'updated_at' : 'updatedAt';

function checkRecipe(recipe) {
  const schema = Joi.object({
    nev: Joi.string().min(1).max(100).required(),
    kep: Joi.string().optional(),
    hozzavalok: Joi.string().min(1).required(),
    leiras: Joi.string().min(1).required(),
    keszitesi_utmutato: Joi.string().min(1).required(),
    elokeszitesi_ido: Joi.string().optional(),
    sutesi_ido: Joi.string().optional(),
    adagok_szama: Joi.string().optional(),
  });
  return schema.validate(recipe);
}

export const addRecipePage = async (req, res, next) => {
  try {
    res.render('add', { menu: mainMenu, user: req.session.user });
  } catch (err) {
    next(err);
  }
};

export const postRecipe = async (req, res, next) => {
  const { nev, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama } = req.body;
  let kepNev = null;

  console.log('Beérkező adatok:', req.body);

  const { error } = checkRecipe(req.body);
  if (error) {
    return res.status(400).render('add', {
      menu: mainMenu,
      user: req.session.user,
      error: error.details[0].message,
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    if (req.file) {
      const uploadDir = join(__dirname, '..', 'assets', 'images');
      await fs.mkdir(uploadDir, { recursive: true });
      const oldPath = req.file.path;
      kepNev = `${Date.now()}-${req.file.originalname}`;
      const newPath = join(uploadDir, kepNev);
      await fs.rename(oldPath, newPath);
    }

    const query = `INSERT INTO Recipe (nev, kep, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama, ${createdAtField}, ${updatedAtField}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      nev || '',
      kepNev || null,
      leiras || '',
      hozzavalok || '',
      keszitesi_utmutato || '',
      elokeszitesi_ido || null,
      sutesi_ido || null,
      adagok_szama || null,
      new Date().toISOString(), // SQLite esetén explicit dátum
      new Date().toISOString(),
    ];
    await connection.execute(query, params);

    await connection.commit();
    res.redirect('/recipes');
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export const editRecipePage = async (req, res, next) => {
  try {
    let rows;
    if (process.env.DB_TYPE === 'sqlite') {
      [rows] = await db.execute('SELECT * FROM Recipe WHERE id = ?', [req.params.id]);
    } else if (process.env.DB_TYPE === 'mysql') {
      [rows] = await db.execute('SELECT * FROM Recipe WHERE id = ?', [req.params.id]);
    }
    if (rows.length === 0) {
      return res.status(404).render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'A recept nem található.',
      });
    }
    const recipe = rows[0];
    res.render('edit', { menu: mainMenu, user: req.session.user, recipe });
  } catch (err) {
    next(err);
  }
};

export const postEditRecipe = async (req, res, next) => {
  const { id } = req.params;
  const { nev, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama } = req.body;
  let kepNev = null;

  console.log('Beérkező adatok:', req.body);

  const { error } = checkRecipe(req.body);
  if (error) {
    return res.status(400).render('edit', {
      menu: mainMenu,
      user: req.session.user,
      recipe: req.body,
      error: error.details[0].message,
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let rows;
    if (process.env.DB_TYPE === 'sqlite') {
      [rows] = await connection.execute('SELECT * FROM Recipe WHERE id = ?', [id]);
    } else if (process.env.DB_TYPE === 'mysql') {
      [rows] = await connection.execute('SELECT * FROM Recipe WHERE id = ?', [id]);
    }
    if (rows.length === 0) {
      throw new Error('A recept nem található.');
    }
    const existingRecipe = rows[0];
    kepNev = existingRecipe.kep || null;

    if (req.file) {
      const uploadDir = join(__dirname, '..', 'assets', 'images');
      await fs.mkdir(uploadDir, { recursive: true });
      const oldPath = req.file.path;
      kepNev = `${Date.now()}-${req.file.originalname}`;
      const newPath = join(uploadDir, kepNev);
      await fs.rename(oldPath, newPath);

      if (existingRecipe.kep) {
        const oldImagePath = join(uploadDir, existingRecipe.kep);
        try {
          await fs.unlink(oldImagePath);
        } catch (e) {
          console.log('Nem sikerült törölni a régi képet:', e.message);
        }
      }
    }

    const updateData = {
      nev: nev !== undefined && nev !== '' ? nev : existingRecipe.nev,
      leiras: leiras !== undefined && leiras !== '' ? leiras : existingRecipe.leiras,
      hozzavalok: hozzavalok !== undefined && hozzavalok !== '' ? hozzavalok : existingRecipe.hozzavalok,
      keszitesi_utmutato: keszitesi_utmutato !== undefined && keszitesi_utmutato !== '' ? keszitesi_utmutato : existingRecipe.keszitesi_utmutato,
      elokeszitesi_ido: elokeszitesi_ido !== undefined && elokeszitesi_ido !== '' ? elokeszitesi_ido : existingRecipe.elokeszitesi_ido,
      sutesi_ido: sutesi_ido !== undefined && sutesi_ido !== '' ? sutesi_ido : existingRecipe.sutesi_ido,
      adagok_szama: adagok_szama !== undefined && adagok_szama !== '' ? adagok_szama : existingRecipe.adagok_szama,
      kep: kepNev || existingRecipe.kep,
    };

    const query = `UPDATE Recipe SET nev = ?, kep = ?, leiras = ?, hozzavalok = ?, keszitesi_utmutato = ?, elokeszitesi_ido = ?, sutesi_ido = ?, adagok_szama = ?, ${updatedAtField} = ? WHERE id = ?`;
    const params = [
      updateData.nev,
      updateData.kep,
      updateData.leiras,
      updateData.hozzavalok,
      updateData.keszitesi_utmutato,
      updateData.elokeszitesi_ido,
      updateData.sutesi_ido,
      updateData.adagok_szama,
      new Date().toISOString(), // Explicit dátum SQLite-hoz
      id,
    ];
    await connection.execute(query, params);

    await connection.commit();
    res.redirect('/recipes');
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export const searchRecipes = async (req, res, next) => {
  const { keyword } = req.query;
  let query = 'SELECT * FROM Recipe';
  let params = [];
  if (keyword) {
    query += ' WHERE LOWER(nev) LIKE ? OR LOWER(hozzavalok) LIKE ?';
    params = [`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`];
  }
  try {
    let rows;
    if (process.env.DB_TYPE === 'sqlite') {
      [rows] = await db.execute(query, params);
    } else if (process.env.DB_TYPE === 'mysql') {
      [rows] = await db.execute(query, params);
    }
    res.render('search', { menu: mainMenu, user: req.session.user, recipes: rows, keyword: keyword || '' });
  } catch (err) {
    next(err);
  }
};

export const userRecipes = async (req, res, next) => {
  try {
    let rows;
    if (process.env.DB_TYPE === 'sqlite') {
      [rows] = await db.execute('SELECT * FROM Recipe');
    } else if (process.env.DB_TYPE === 'mysql') {
      [rows] = await db.execute('SELECT * FROM Recipe');
    }
    res.render('user', { menu: mainMenu, user: req.session.user, recipes: rows });
  } catch (err) {
    next(err);
  }
};

export const listRecipes = async (req, res, next) => {
  try {
    let rows;
    const searchQuery = req.query.search;
    const isAdmin = req.session.user && req.session.user.type === 'admin'; // Ellenőrzi az admin jogosultságot

    if (process.env.DB_TYPE === 'sqlite') {
      if (searchQuery) {
        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        [rows] = await db.execute(
          `SELECT * FROM Recipe WHERE LOWER(nev) LIKE ? OR LOWER(leiras) LIKE ? OR LOWER(hozzavalok) LIKE ? OR LOWER(keszitesi_utmutato) LIKE ? ORDER BY ${updatedAtField} DESC`,
          [searchTerm, searchTerm, searchTerm, searchTerm]
        );
      } else {
        [rows] = await db.execute(`SELECT * FROM Recipe ORDER BY ${updatedAtField} DESC`);
      }
      console.log('SQLite listRecipes eredménye:', rows);
    } else if (process.env.DB_TYPE === 'mysql') {
      if (searchQuery) {
        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        [rows] = await db.execute(
          `SELECT * FROM Recipe WHERE LOWER(nev) LIKE ? OR LOWER(leiras) LIKE ? OR LOWER(hozzavalok) LIKE ? OR LOWER(keszitesi_utmutato) LIKE ? ORDER BY ? DESC`,
          [searchTerm, searchTerm, searchTerm, searchTerm, updatedAtField]
        );
      } else {
        [rows] = await db.execute(`SELECT * FROM Recipe ORDER BY ? DESC`, [updatedAtField]);
      }
      console.log('MySQL listRecipes eredménye:', rows);
    } else {
      throw new Error(`Ismeretlen DB_TYPE: ${process.env.DB_TYPE}`);
    }

    res.render('recipes', {
      menu: mainMenu,
      user: req.session.user,
      recipes: rows,
      searchQuery: searchQuery || '',
      isAdmin,
    });

    console.log('Session user:', req.session.user);
  } catch (err) {
    console.error('Hiba a listRecipes lekérdezésnél:', err);
    next(err);
  }
};

export const deleteRecipe = async (req, res, next) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let existingRows;
    if (process.env.DB_TYPE === 'sqlite') {
      [existingRows] = await connection.execute('SELECT kep FROM Recipe WHERE id = ?', [id]);
    } else if (process.env.DB_TYPE === 'mysql') {
      [existingRows] = await connection.execute('SELECT kep FROM Recipe WHERE id = ?', [id]);
    }
    if (existingRows.length === 0) {
      throw new Error('A recept nem található.');
    }
    const existingRecipe = existingRows[0];
    const kepNev = existingRecipe.kep;

    if (process.env.DB_TYPE === 'sqlite') {
      await connection.execute('DELETE FROM Recipe WHERE id = ?', [id]);
    } else if (process.env.DB_TYPE === 'mysql') {
      await connection.execute('DELETE FROM Recipe WHERE id = ?', [id]);
    }

    if (kepNev) {
      const imagePath = join(__dirname, '..', 'assets', 'images', kepNev);
      try {
        await fs.unlink(imagePath);
      } catch (e) {
        console.log('Nem sikerült törölni a képet:', e.message);
      }
    }

    await connection.commit();
    res.redirect('/recipes');
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export const viewRecipe = async (req, res, next) => {
  const { id } = req.params;
  try {
    let rows;
    if (process.env.DB_TYPE === 'sqlite') {
      [rows] = await db.execute('SELECT * FROM Recipe WHERE id = ?', [id]);
    } else if (process.env.DB_TYPE === 'mysql') {
      [rows] = await db.execute('SELECT * FROM Recipe WHERE id = ?', [id]);
    }
    if (rows.length === 0) {
      return res.status(404).render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'A recept nem található.',
      });
    }
    const recipe = rows[0];
    res.render('recipe', { menu: mainMenu, user: req.session.user, recipe });
  } catch (err) {
    next(err);
  }
};