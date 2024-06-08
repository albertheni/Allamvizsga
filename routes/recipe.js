import express from "express";
import * as recipeController from "../controllers/recipeController.js";

const router = express.Router();

router.post("/", recipeController.addRecipe);
router.put("/:id", recipeController.updateRecipe);
router.delete("/:id", recipeController.deleteRecipe);
router.get("/:id", recipeController.getRecipeById);
router.get("/", recipeController.getAllRecipes);
// Új útvonal a JSON fájl betöltéséhez
// router.post("/load-json", recipeController.loadRecipesFromJson);

export default router;
