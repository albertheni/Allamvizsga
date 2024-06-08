import { DataTypes } from "sequelize";
import { getClient } from "../db/config.js";
import logger from "../utils/logging.js";

const sequelize = getClient();
const Recipe = sequelize.define('Recipe', {
    nev: {
      type: DataTypes.STRING,
      allowNull: false
    },
    kep: {
      type: DataTypes.STRING,
      allowNull: false
    },
    leiras: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    hozzavalok: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    keszitesi_utmutato: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    elokeszitesi_ido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sutesi_ido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    adagok_szama: {
      type: DataTypes.STRING,
      allowNull: false
    }
}, { 
    tableName: "Recipe"
});

await Recipe.sync(); //letrehozza a tablat, ha mar letezik callbackel

async function tableExists() { //megnezi, ha letezik a tabla
    const tableNames = await sequelize.getQueryInterface().showAllTables();
    logger.debug(tableNames);
    return tableNames.includes('Recipe');
}

// CRUD műveletek

// Új recept hozzáadása
async function addRecipe(recipeData) {
    return await Recipe.create(recipeData);
}

// Recept szerkesztése
async function updateRecipe(id, updatedData) {
    return await Recipe.update(updatedData, {
        where: { id }
    });
}

// Recept törlése
async function deleteRecipe(id) {
    return await Recipe.destroy({
        where: { id }
    });
}

// Recept lekérdezése ID alapján
async function getRecipeById(id) {
    return await Recipe.findByPk(id);
}

// Az összes recept lekérdezése
async function getAllRecipes() {
    return await Recipe.findAll();
}


export default {
    Recipe,
    tableExists,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeById,
    getAllRecipes
}
