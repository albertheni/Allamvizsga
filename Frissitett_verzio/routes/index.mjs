import express from 'express';
import * as indexController from '../controllers/indexController.mjs';

export const router = express.Router();

router.get('/', indexController.home);