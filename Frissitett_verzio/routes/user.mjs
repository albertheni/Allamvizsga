import express from 'express';
import * as userController from '../controllers/userController.mjs';

export const router = express.Router();

router.get('/register', userController.register);
router.post('/register', userController.postRegister);
router.get('/login', userController.login);
router.post('/login', userController.postLogin);
router.get('/logout', userController.logout);