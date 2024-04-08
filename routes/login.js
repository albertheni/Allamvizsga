import express from "express"
import loginController from "../controllers/loginController.js"
import passport from "passport";

const router = express.Router();

router.get("/",loginController.betoltOldal) //betolti az oldalt
                                            //az utvonalat mutatja, es hogy milyen metodust kap
router.post("/",loginController.authenticate) //felhasznalja az informaciot, ami az authentificateben van

router.post("/",passport.authenticate("local"),(req,res)=>{  //ez tartja bejelentkezve a felhasznalot
    console.log("login");
    res.send(200);
});

export default router
