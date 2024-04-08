import express from "express"
import registerController from "../controllers/registerController.js";

const router = express.Router();

router.get("/",registerController.betoltOldal);
router.post("/",registerController.regisztral); //beregisztral

export default router
