import express from "express"
import adminController from "../controllers/adminController.js";

const router = express.Router();

router.get("/",adminController.betoltOldal)

export default router
