
import { mainMenu } from '../helpers/menus.mjs';
import db from '../db/mysqlconn.mjs';

export const home = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Recipe', []); // MySQL kompatibilis
    res.render('home', { //itt adom meg melyik ejs-t hasznalja
      menu: mainMenu,
      user: req.session.user,   //ide 
      recipes: rows || [],
    });
  } catch (err) {
    next(err);
  }
};