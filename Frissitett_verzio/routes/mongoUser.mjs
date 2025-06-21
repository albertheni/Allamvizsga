import express from 'express';
import * as mongoUserController from '../controllers/mongoUserController.mjs';

export const router = express.Router();

router.get('/register', mongoUserController.register);
router.post('/register', mongoUserController.postRegister);
router.get('/login', mongoUserController.login);
router.post('/login', mongoUserController.postLogin);
router.get('/logout', mongoUserController.logout);