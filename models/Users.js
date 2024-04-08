import { DataTypes } from "sequelize";
import { getClient } from "../db/config.js";
import logger from "../utils/logging.js";

const sequelize = getClient();
const User = sequelize.define('User', { //meghatarozzuk az adatabazis tablank oszlopait
    // Model attributes are defined here
    userName: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, { "tableName": "User" }); //nev letrehozasa

await User.sync(); //letrehozza a tablat, ha mar letezik callbackel

async function tableExists() { //megnezi, ha letezik a tabla
    const tableNames = await sequelize.getQueryInterface().showAllTables();
    logger.debug(tableNames);
    
    return tableNames.includes('User');
}

async function regisztralas(userName,email,password,type){ //letrehoz es visszateriti az uj felhasznalo, 
    const ujAdat = await User.findOne({                     //vagy visszaterit -1-et ha mar leytezik
        where: {email}          //email alapjan keresi,ha mar van ilyen felhasznalo
    });
    if(ujAdat){ //ha kap ilyen hfelhasznalot, visszaterit -1-et
        return -1;
    }
    else{ //egyebkent letrehozza a felhasznalot es visszateriti
        const ujFelhasznalo = await User.create({
            userName,email,password,type
        });
        return ujFelhasznalo;
    }
}

async function findID(id){ //keres id alapjan
    return await User.findOne({
        where: {id}
    });
}

async function findEmail(email){  //keres email alapjan
    return await User.findOne({
        where: {email}
    });
}

export default {
    User,
    tableExists,
    regisztralas,
    findID,
    findEmail

}
