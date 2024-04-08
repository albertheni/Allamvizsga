import User from "../models/Users.js"
import passport from "passport";
import { Strategy } from "passport-local";

function betoltOldal(_req, res, _next){  //a oldal betolteset valositjuk meg
    res.render('login');
}

/*
function bejelentkezes(req,res, _next){
    const {email,password} = req.body;
    if(!email || !password){
        res.status(401).send({"Hiba":"Nem elegendo az informacio!"})    }
    const userValtozo =  User.findEmail(email);
    if(password == userValtozo.password){
        if(type=="type1"){
            return res.sender("type1");
        }
    }
}
*/

function authenticate(req, res, next) { //a hitelesitest csinalja
    console.log("here");
    passport.authenticate('local', (err, user, info) => { //megnezi,hogy van-e regisztralt oldal
        if (err) {
            console.log(err);
            return next(err);
        }
        if (!user) {
            return res.redirect('/login'); // Ha nem sikerul a bejelentkezes, visszakuld  a login reszhez
        }
        req.logIn(user, (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            console.log("Logged in"); 
            if (user.type === 'user') { //megnezi, hogy milyen tipusu a bejelentkezo
                return res.redirect('/user');
            } else {
                return res.redirect('/admin');
            }
        });
    })(req, res, next);
}


passport.serializeUser((user,done)=> { //benttartja a bejelentkezett felhasznalot
    console.log("Serilized account:")
    console.log(user);
    done(null, user.id)});
                                                       //szessziokezeles(kozosen 49 es 54)
passport.deserializeUser(async (id,done)=>{  
    console.log(id);
    try{
        const account = await User.findID(id);
        if (!account){
            throw new Error("No user found");
        }
        console.log("Deserilized account:")
        console.log(account);
        done(null, account);
    } catch (err){
        console.log(err);
    }
})

passport.use(    //strategia amit hasznal az authenticate a hitelesiteshez
    new Strategy({
        usernameField: "email", //email alapjan keresi a jelszavat az adatbazisban
    }, async (email, password, done) => {
        try {
            if (!email || !password) {
                throw new Error("Missing credentials");
            }
            const accountDb = await User.findEmail(email);
            if (!accountDb) throw new Error("Account not found"); //ha nem kapja az emailt hibat terit vissza

            if (accountDb.password == password) {//megnezi, hogy helyes-e a jelszo
                console.log("Successful authentication");
                if (accountDb.type == "user") {  //milyen tipusu a felhasznalo
                    done(null, accountDb, { userRedirect: "/user" });
                } else {
                    done(null, accountDb, { adminRedirect: "/admin" });
                }
            } else {
                console.log("Unsuccessful authentication");  //nem sikerult a hitelesites
                done(null, null);
            }
        } catch (err) {
            console.log(err);
            done(err, null);
        }
    })
);

export default{
    betoltOldal,
    authenticate
}
