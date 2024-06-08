import recipeModel from "../models/Recipe.js";
import fs from "fs";
import path from "path";

// Új recept hozzáadása
export async function addRecipe(req, res) {
    try {
        const newRecipe = await recipeModel.addRecipe(req.body);
        res.status(201).json(newRecipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Recept szerkesztése
export async function updateRecipe(req, res) {
    try {
        const updatedRecipe = await recipeModel.updateRecipe(req.params.id, req.body);
        if (updatedRecipe[0] === 0) {
            return res.status(404).json({ error: "Recipe not found" });
        }
        res.json({ message: "Recipe updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Recept törlése
export async function deleteRecipe(req, res) {
    try {
        const result = await recipeModel.deleteRecipe(req.params.id);
        if (result === 0) {
            return res.status(404).json({ error: "Recipe not found" });
        }
        res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Recept lekérdezése ID alapján
export async function getRecipeById(req, res) {
    try {
        const recipe = await recipeModel.getRecipeById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }
        res.json(recipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Az összes recept lekérdezése
export async function getAllRecipes(req, res) {
    try {
        const recipes = await recipeModel.getAllRecipes();
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// const recipesFilePath = path.join(__dirname, "../public/recipes.json");

export const loadRecipesFromJson = async (req, res) => {
    console.log(req.body);
    try {
        const data = fs.readFileSync("C://Users//Henrietta//Documents//GitHub//Allamvizsga//public//recipes.json", "utf8");
        const recipes = JSON.parse(data);
        console.log("alma",recipes.receptek);

        for (const recipe of recipes.receptek) {
            await recipeModel.addRecipe({
                nev: recipe.nev,
                kep: recipe.kep,
                leiras: recipe.leiras,
                hozzavalok: recipe.hozzavalok.join(", "), // Ha az adatbázisba stringként tárolod
                keszitesi_utmutato: recipe.keszitesi_utmutato,
                elokeszitesi_ido: recipe.elokeszitesi_ido,
                sutesi_ido: recipe.sutesi_ido,
                adagok_szama: recipe.adagok_szama
            });
            
        }

        res.status(200).json({ message: "Receptek sikeresen betöltve a JSON fájlból." });
    } catch (error) {
        console.error("Hiba a JSON fájl betöltése során:", error);
        res.status(500).json({ message: "Hiba a JSON fájl betöltése során." });
    }
};
