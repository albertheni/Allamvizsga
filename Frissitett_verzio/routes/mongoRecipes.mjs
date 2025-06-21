import express from 'express';
import * as mongoUserController from '../controllers/mongoUserController.mjs';
import * as mongoRecipeController from '../controllers/mongoRecipeController.mjs';

export const router = express.Router();

router.all(['/add', '/edit/:id', '/delete/:id'], mongoUserController.isAdmin);
router.get('/', mongoRecipeController.listRecipes);
router.get('/add', mongoRecipeController.addRecipePage);
router.post('/add', mongoRecipeController.postRecipe);
router.get('/edit/:id', mongoRecipeController.editRecipePage);
router.post('/edit/:id', mongoRecipeController.postEditRecipe);
router.get('/search', mongoRecipeController.searchRecipes);
router.get('/user', mongoRecipeController.userRecipes);
router.get('/delete/:id', mongoRecipeController.deleteRecipe);
router.get('/:id', mongoRecipeController.viewRecipe);