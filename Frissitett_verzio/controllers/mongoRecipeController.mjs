import { mainMenu } from '../helpers/menus.mjs';
import Joi from 'joi';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import Recipe from '../models/Recipe.js';

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
    adagok_szama: Joi.string().optional(),
  });
  return schema.validate({
    nev: recipe.nev,
    kep: recipe.kep,
    hozzavalok: recipe.hozzavalok,
    leiras: recipe.leiras,
    keszitesi_utmutato: recipe.keszitesi_utmutato,
    elokeszitesi_ido: recipe.elokeszitesi_ido,
    sutesi_ido: recipe.sutesi_ido,
    adagok_szama: recipe.adagok_szama,
  });
}

export const addRecipePage = async (req, res, next) => {
  try {
    console.log('addRecipePage meghívva');
    res.render('add', { menu: mainMenu, user: req.session.user, error: null });
  } catch (err) {
    console.error('Hiba az addRecipePage függvényben:', err);
    next(err);
  }
};

export const postRecipe = async (req, res, next) => {
  const { nev, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama } = req.body;
  let kepNev = null;

  console.log('postRecipe meghívva, beérkező adatok:', req.body);

  const { error } = checkRecipe(req.body);
  if (error) {
    console.log('Validációs hiba:', error.details[0].message);
    return res.status(400).render('add', {
      menu: mainMenu,
      user: req.session.user,
      error: error.details[0].message,
      recipe: req.body,
    });
  }

  try {
    if (req.file) {
      const uploadDir = join(__dirname, '..', 'assets', 'images');
      await fs.mkdir(uploadDir, { recursive: true });
      const oldPath = req.file.path;
      kepNev = `${Date.now()}-${req.file.originalname}`;
      const newPath = join(uploadDir, kepNev);
      await fs.rename(oldPath, newPath);
    }

    const newRecipe = new Recipe({
      nev,
      kep: kepNev,
      leiras,
      hozzavalok,
      keszitesi_utmutato,
      elokeszitesi_ido,
      sutesi_ido,
      adagok_szama,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newRecipe.save();
    console.log('Új recept mentve:', nev);

    res.redirect('/recipes');
  } catch (err) {
    console.error('Hiba a postRecipe függvényben:', err);
    res.status(500).render('add', {
      menu: mainMenu,
      user: req.session.user,
      error: 'Hiba a recept mentése során, kérlek próbáld újra.',
      recipe: req.body,
    });
  }
};

export const editRecipePage = async (req, res, next) => {
  try {
    console.log('editRecipePage meghívva, id:', req.params.id);
    const recipe = await Recipe.findById(req.params.id).lean();
    if (!recipe) {
      console.log('Recept nem található:', req.params.id);
      return res.status(404).render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'A recept nem található.',
      });
    }
    const formattedRecipe = {
      id: recipe._id.toString(),
      nev: recipe.nev,
      hozzavalok: recipe.hozzavalok,
      leiras: recipe.leiras,
      kep: recipe.kep,
      keszitesi_utmutato: recipe.keszitesi_utmutato,
      elokeszitesi_ido: recipe.elokeszitesi_ido,
      sutesi_ido: recipe.sutesi_ido,
      adagok_szama: recipe.adagok_szama,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    };
    res.render('edit', { menu: mainMenu, user: req.session.user, recipe: formattedRecipe, error: null });
  } catch (err) {
    console.error('Hiba az editRecipePage függvényben:', err);
    next(err);
  }
};

export const postEditRecipe = async (req, res, next) => {
  const { id } = req.params;
  const { nev, leiras, hozzavalok, keszitesi_utmutato, elokeszitesi_ido, sutesi_ido, adagok_szama } = req.body;
  let kepNev = null;

  console.log('postEditRecipe meghívva, id:', id, 'beérkező adatok:', req.body);

  const { error } = checkRecipe(req.body);
  if (error) {
    console.log('Validációs hiba:', error.details[0].message);
    return res.status(400).render('edit', {
      menu: mainMenu,
      user: req.session.user,
      recipe: { id, ...req.body },
      error: error.details[0].message,
    });
  }

  try {
    const existingRecipe = await Recipe.findById(id);
    if (!existingRecipe) {
      console.log('Recept nem található:', id);
      throw new Error('A recept nem található.');
    }
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
      nev: nev || existingRecipe.nev,
      leiras: leiras || existingRecipe.leiras,
      hozzavalok: hozzavalok || existingRecipe.hozzavalok,
      keszitesi_utmutato: keszitesi_utmutato || existingRecipe.keszitesi_utmutato,
      elokeszitesi_ido: elokeszitesi_ido || existingRecipe.elokeszitesi_ido,
      sutesi_ido: sutesi_ido || existingRecipe.sutesi_ido,
      adagok_szama: adagok_szama || existingRecipe.adagok_szama,
      kep: kepNev || existingRecipe.kep,
      updatedAt: new Date().toISOString(),
    };

    await Recipe.findByIdAndUpdate(id, updateData);
    console.log('Recept frissítve:', id);

    res.redirect('/recipes');
  } catch (err) {
    console.error('Hiba a postEditRecipe függvényben:', err);
    res.status(500).render('edit', {
      menu: mainMenu,
      user: req.session.user,
      recipe: { id, ...req.body },
      error: 'Hiba a recept frissítése során, kérlek próbáld újra.',
    });
  }
};

export const searchRecipes = async (req, res, next) => {
  const { keyword } = req.query;
  try {
    console.log('searchRecipes meghívva, kulcsszó:', keyword);
    let recipes;
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      recipes = await Recipe.find({
        $or: [
          { nev: regex },
          { hozzavalok: regex },
        ],
      }).lean();
    } else {
      recipes = await Recipe.find({}).lean();
    }
    recipes = recipes.map(recipe => ({
      id: recipe._id.toString(),
      nev: recipe.nev,
      hozzavalok: recipe.hozzavalok,
      leiras: recipe.leiras,
      kep: recipe.kep,
      keszitesi_utmutato: recipe.keszitesi_utmutato,
      elokeszitesi_ido: recipe.elokeszitesi_ido,
      sutesi_ido: recipe.sutesi_ido,
      adagok_szama: recipe.adagok_szama,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    }));
    res.render('search', { menu: mainMenu, user: req.session.user, recipes, keyword: keyword || '' });
  } catch (err) {
    console.error('Hiba a searchRecipes függvényben:', err);
    next(err);
  }
};

export const userRecipes = async (req, res, next) => {
  try {
    console.log('userRecipes meghívva');
    const recipes = await Recipe.find({}).lean();
    const formattedRecipes = recipes.map(recipe => ({
      id: recipe._id.toString(),
      nev: recipe.nev,
      hozzavalok: recipe.hozzavalok,
      leiras: recipe.leiras,
      kep: recipe.kep,
      keszitesi_utmutato: recipe.keszitesi_utmutato,
      elokeszitesi_ido: recipe.elokeszitesi_ido,
      sutesi_ido: recipe.sutesi_ido,
      adagok_szama: recipe.adagok_szama,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    }));
    res.render('user', { menu: mainMenu, user: req.session.user, recipes: formattedRecipes });
  } catch (err) {
    console.error('Hiba az userRecipes függvényben:', err);
    next(err);
  }
};

export const listRecipes = async (req, res, next) => {
  try {
    console.log('listRecipes meghívva');
    const searchQuery = req.query.search;
    const isAdmin = req.session.user && req.session.user.type === 'admin';
    let recipes;

    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      recipes = await Recipe.find({
        $or: [
          { nev: regex },
          { leiras: regex },
          { hozzavalok: regex },
          { keszitesi_utmutato: regex },
        ],
      }).sort({ updatedAt: -1 }).lean();
    } else {
      recipes = await Recipe.find({}).sort({ updatedAt: -1 }).lean();
    }

    recipes = recipes.map(recipe => ({
      id: recipe._id.toString(),
      nev: recipe.nev,
      hozzavalok: recipe.hozzavalok,
      leiras: recipe.leiras,
      kep: recipe.kep,
      keszitesi_utmutato: recipe.keszitesi_utmutato,
      elokeszitesi_ido: recipe.elokeszitesi_ido,
      sutesi_ido: recipe.sutesi_ido,
      adagok_szama: recipe.adagok_szama,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    }));

    res.render('recipes', {
      menu: mainMenu,
      user: req.session.user,
      recipes,
      searchQuery: searchQuery || '',
      isAdmin,
    });

    console.log('Session user:', req.session.user);
  } catch (err) {
    console.error('Hiba a listRecipes függvényben:', err);
    next(err);
  }
};

export const deleteRecipe = async (req, res, next) => {
  const { id } = req.params;

  try {
    console.log('deleteRecipe meghívva, id:', id);
    const existingRecipe = await Recipe.findById(id);
    if (!existingRecipe) {
      console.log('Recept nem található:', id);
      throw new Error('A recept nem található.');
    }
    const kepNev = existingRecipe.kep;

    await Recipe.findByIdAndDelete(id);
    console.log('Recept törölve:', id);

    if (kepNev) {
      const imagePath = join(__dirname, '..', 'assets', 'images', kepNev);
      try {
        await fs.unlink(imagePath);
      } catch (e) {
        console.log('Nem sikerült törölni a képet:', e.message);
      }
    }

    res.redirect('/recipes');
  } catch (err) {
    console.error('Hiba a deleteRecipe függvényben:', err);
    res.status(500).render('message', {
      menu: mainMenu,
      user: req.session.user,
      message: 'Hiba a recept törlése során, kérlek próbáld újra.',
    });
  }
};

export const viewRecipe = async (req, res, next) => {
  const { id } = req.params;
  try {
    console.log('viewRecipe meghívva, id:', id);
    const recipe = await Recipe.findById(id).lean();
    if (!recipe) {
      console.log('Recept nem található:', id);
      return res.status(404).render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'A recept nem található.',
      });
    }
    const formattedRecipe = {
      id: recipe._id.toString(),
      nev: recipe.nev,
      hozzavalok: recipe.hozzavalok,
      leiras: recipe.leiras,
      kep: recipe.kep,
      keszitesi_utmutato: recipe.keszitesi_utmutato,
      elokeszitesi_ido: recipe.elokeszitesi_ido,
      sutesi_ido: recipe.sutesi_ido,
      adagok_szama: recipe.adagok_szama,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    };
    res.render('recipe', { menu: mainMenu, user: req.session.user, recipe: formattedRecipe });
  } catch (err) {
    console.error('Hiba a viewRecipe függvényben:', err);
    next(err);
  }
};