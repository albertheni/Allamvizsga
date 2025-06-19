import express from 'express';
import * as userController from '../controllers/userController.mjs';
import * as recipeController from '../controllers/recipeController.mjs';

export const router = express.Router();

// router.all(['/', '/add', '/edit/:id', '/search', '/user'], userController.isAuth);
router.all(['/add', '/edit/:id', '/delete/:id'], userController.isAdmin);
router.get('/', recipeController.listRecipes);
router.get('/add', recipeController.addRecipePage);
router.post('/add', recipeController.postRecipe);
router.get('/edit/:id', recipeController.editRecipePage);
router.post('/edit/:id', recipeController.postEditRecipe);
router.get('/search', recipeController.searchRecipes);
router.get('/user', recipeController.userRecipes);
router.get('/delete/:id', recipeController.deleteRecipe);
router.get('/:id', recipeController.viewRecipe);
