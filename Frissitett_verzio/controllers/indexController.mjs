import { mainMenu } from '../helpers/menus.mjs';
import db from '../db/dbconn.mjs'; // Frissített import

export const home = async (req, res, next) => {
  try {
    let rows;
    if (process.env.DB_TYPE === 'sqlite') {
      [rows] = await db.execute('SELECT * FROM Recipe', []);
    } else if (process.env.DB_TYPE === 'mysql') {
      [rows] = await db.execute('SELECT * FROM Recipe', []);
    } else {
      throw new Error(`Ismeretlen DB_TYPE: ${process.env.DB_TYPE}`);
    }
    res.render('home', {
      menu: mainMenu,
      user: req.session.user,
      recipes: rows || [],
    });
  } catch (err) {
    next(err);
  }
};