import express from "express"
import homeController from "../controllers/homeController.js";

const router = express.Router();

router.get("/",homeController.betoltOldal) //az utvonalat mutatja, es hogy milyen metodust kap

export default router
