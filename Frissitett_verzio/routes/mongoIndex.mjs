import express from 'express';
import * as mongoIndexController from '../controllers/mongoIndexController.mjs';
console.log('mongoIndex.mjs betöltve');
export const router = express.Router();

router.get('/', (req, res, next) => {
  console.log('GET / kérés érkezett a mongoIndex.mjs-ben');
  mongoIndexController.home(req, res, next);
});