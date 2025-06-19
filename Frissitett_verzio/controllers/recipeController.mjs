import { protMenu as mainMenu } from '../helpers/menus.mjs';
import db from '../db/mysqlconn.mjs';
import Joi from 'joi';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkRecipe(recipe) {
  const schema = Joi.object({
    nev: Joi.string().min(1).max(100).required(),
    kep: Joi.string().optional(),
    hozzavalok: Joi.string().min(1).required(),
    leiras: Joi.string().min(1).required(),
    keszitesi_utmutato: Joi.string().min(1).required(),
    elokeszitesi_ido: Joi.string().optional(),
    sutesi_ido: Joi.string().optional(),
    adagok_szama: Joi.string().optional()
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
  
  console.log('Beérkező adatok:', req.body); // Hibakereséshez logolás

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

    const query = 'INSERT INTO Recipe (nev, kep, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
    const params = [
      nev || '',
      kepNev || null,
      leiras || '',
      hozzavalok || '',
      keszitesi_utmutato || '',
      elokeszitesi_ido || null,
      sutesi_ido || null,
      adagok_szama || '0' // Alapértelmezett érték, ha üres
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
    const [rows] = await db.execute('SELECT * FROM Recipe WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'A recept nem található.'
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
  //console.log('Beérkező adatok:', req.body); // Új log a beérkező adatokhoz

  const { nev, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama } = req.body;
  let kepNev = null;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingRows] = await connection.execute('SELECT * FROM Recipe WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      throw new Error('A recept nem található.');
    }
    const existingRecipe = existingRows[0];
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
      updatedAt: 'NOW()'
    };
    console.log('Frissítendő adatok:', updateData); // Logolás az updateData után

    const [result] = await connection.execute(
      'UPDATE Recipe SET nev = ?, kep = ?, leiras = ?, hozzavalok = ?, keszitesi_utmutato = ?, elokeszitesi_ido = ?, sutesi_ido = ?, adagok_szama = ?, updatedAt = NOW() WHERE id = ?',
      [updateData.nev, updateData.kep, updateData.leiras, updateData.hozzavalok, updateData.keszitesi_utmutato, updateData.elokeszitesi_ido, updateData.sutesi_ido, updateData.adagok_szama, id]
    );
    console.log('Frissítési eredmény:', result);
    console.log('Figyelmeztetések:', await connection.execute('SHOW WARNINGS'));

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
  let query = 'SELECT * FROM recipe';
  let params = [];
  if (keyword) {
    query += ' WHERE nev LIKE ? OR hozzavalok LIKE ?';
    params = [`%${keyword}%`, `%${keyword}%`];
  }
  try {
    const [rows] = await db.execute(query, params);
    res.render('search', { menu: mainMenu, user: req.session.user, recipes: rows, keyword: keyword || '' });
  } catch (err) {
    next(err);
  }
};

export const userRecipes = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM recipe');
    res.render('user', { menu: mainMenu, user: req.session.user, recipes: rows });
  } catch (err) {
    next(err);
  }
};

export const listRecipes = async (req, res, next) => {
  try {
    let [rows] = await db.execute('SELECT * FROM Recipe ');
    const searchQuery = req.query.search;

    if (searchQuery) {
      const searchTerm = `%${searchQuery}%`; // Szöveges keresés LIKE operátorral
      [rows] = await db.execute(
        'SELECT * FROM Recipe WHERE nev LIKE ? OR leiras LIKE ? OR hozzavalok LIKE ? OR keszitesi_utmutato LIKE ? ORDER BY updatedAt DESC',
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );
    }

    res.render('recipes', { 
      menu: mainMenu, 
      user: req.session.user, 
      recipes: rows,
      searchQuery: searchQuery // Átadjuk a keresési kifejezést a nézetnek
    });
  } catch (err) {
    next(err);
  }
};


export const deleteRecipe = async (req, res, next) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Recept lekérdezése a kép neve miatt
    const [existingRows] = await connection.execute('SELECT kep FROM Recipe WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      throw new Error('A recept nem található.');
    }
    const existingRecipe = existingRows[0];
    const kepNev = existingRecipe.kep;

    // Recept törlése
    await connection.execute('DELETE FROM Recipe WHERE id = ?', [id]);

    // Kép törlése, ha létezik
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
    const [rows] = await db.execute('SELECT * FROM Recipe WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'A recept nem található.'
      });
    }
    const recipe = rows[0];
    res.render('recipe', { menu: mainMenu, user: req.session.user, recipe });
  } catch (err) {
    next(err);
  }
};