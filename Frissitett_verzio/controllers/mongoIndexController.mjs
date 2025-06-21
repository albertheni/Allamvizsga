import { mainMenu } from '../helpers/menus.mjs';
import Recipe from '../models/Recipe.js';

export const home = async (req, res, next) => {
    console.log('Home függvény meghívva');
  try {
    const recipes = await Recipe.find({}).lean();
    // Az adatokat a sablon által elvárt formátumba konvertáljuk
    const formattedRecipes = recipes.map(recipe => ({
      id: recipe._id.toString(),
      name: recipe.nev,
      ingredients: recipe.hozzavalok,
      description: recipe.leiras,
      kep: recipe.kep,
      keszitesi_utmutato: recipe.keszitesi_utmutato,
      elokeszitesi_ido: recipe.elokeszitesi_ido,
      sutesi_ido: recipe.sutesi_ido,
      adagok_szama: recipe.adagok_szama,
      created_at: recipe.createdAt,
      updated_at: recipe.updatedAt,
    }));
    res.render('home', {
      menu: mainMenu,
      user: req.session.user,
      recipes: formattedRecipes,
    });
  } catch (err) {
    next(err);
  }
};