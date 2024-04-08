import User from "../models/Users.js";

function betoltOldal(_req, res, _next){
    res.render('register');
}

async function regisztral(req,res,_next){ //a beregisztralja az adatokat es beteszi az adatbazisba
    const{username,email, password,type} = req.body;
    if(!username || !email || !password || !type){ //ha nem tolt ki minden mezot, hibat ir ki
        res.status(401).send({"Hiba":"Nem elegendo az informacio!"})
    }
    const felhasznalo = User.regisztralas(username,email, password,type); //beregisztral(models/Users-ben megirt fuggveny)

    if (felhasznalo == -1){ //megnezi, ha beregisztralt felhasznalo mar letezik-e
        res.status(400).send({"Hiba":"Mar letezik!"});
    }
    else{ //megnezi a tipusat
        if(type=="user"){
            res.redirect("/user")
        }
        if(type=="admin"){
            res.redirect("/admin")
        }
        
    }
}

export default{
    betoltOldal,
    regisztral
}