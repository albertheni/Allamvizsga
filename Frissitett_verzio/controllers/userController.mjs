import { mainMenu } from '../helpers/menus.mjs';
import db from '../db/mysqlconn.mjs'; // Frissített import
import Joi from 'joi';
import { createHash } from 'crypto';

export async function isAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/user/login');
  }
}

export async function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.type === 'admin') {
    next();
  } else {
    res.render('message', {
      menu: mainMenu,
      user: req.session.user,
      message: 'Csak adminisztrátorok férhetnek hozzá ehhez az oldalhoz!',
    });
  }
}

function checkRegister(user) {
  const schema = Joi.object({
    userName: Joi.string().min(1).max(100).required(),
    password: Joi.string().min(1).max(100).required(),
    password1: Joi.ref('password'),
    email: Joi.string().email().required(),
    type: Joi.string().valid('admin', 'user').required(),
  });
  return schema.validate(user);
}

function checkLogin(user) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(1).max(100).required(),
  });
  return schema.validate(user);
}

export const register = (req, res) => {
  if (req.session.user) {
    res.render('message', { menu: mainMenu, user: req.session.user, message: 'Már be vagy jelentkezve!' });
  } else {
    res.render('register', {
      menu: mainMenu,
      user: req.session.user,
      userData: { userName: '', email: '', type: 'user' },
      error: '',
    });
  }
};

export const postRegister = async (req, res, next) => {
  // console.log('req.body:', req.body); // Debug log
  const userData = req.body;
  const result = checkRegister(userData);
  if (result.error) {
    return res.render('register', {
      menu: mainMenu,
      user: req.session.user,
      userData,
      error: result.error.message,
    });
  }

  try {
    const [rows] = await db.execute('SELECT email FROM user2 WHERE email = ?', [userData.email]); // Frissítve user2-re
    if (rows.length > 0) {
      return res.render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: `Ezzel az email címmel már regisztráltak: ${userData.email}`,
      });
    }

    const hash = createHash('sha1').update(userData.password).digest('hex');
    await db.execute(
      'INSERT INTO user2 (userName, email, password, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', // Frissítve user2-re
      [userData.userName, userData.email, hash, userData.type, new Date().toISOString(), new Date().toISOString()]
    );
    
    // Automatikus bejelentkezés a regisztráció után
    const [newUserRows] = await db.execute(
      'SELECT id, email, userName AS name, type FROM user2 WHERE email = ? AND password = ?',
      [userData.email, hash]
    );
    const newUser = newUserRows[0];

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        req.session.user = newUser;
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Átirányítás a főoldalra (mint a bejelentkezés után)
    res.redirect('/recipes');
  } catch (err) {
    next(err);
  }
};

export const login = (req, res) => {
  if (req.session.user) {
    res.render('message', { menu: mainMenu, user: req.session.user, message: 'Már be vagy jelentkezve!' });
  } else {
    res.render('login', {
      menu: mainMenu,
      user: req.session.user,
      userData: { email: '' },
      error: '',
    });
  }
};

export const postLogin = async (req, res, next) => {
  const userData = req.body;
  const result = checkLogin(userData);
  if (result.error) {
    return res.render('login', {
      menu: mainMenu,
      user: req.session.user,
      userData,
      error: result.error.message,
    });
  }

  const hash = createHash('sha1').update(userData.password).digest('hex');
  try {
    const [rows] = await db.execute('SELECT id, email, userName AS name, type FROM user2 WHERE email = ? AND password = ?', [userData.email, hash]); // Frissítve user2-re
    if (rows.length === 0) {
      return res.render('message', {
        menu: mainMenu,
        user: req.session.user,
        message: 'Hibás email vagy jelszó',
      });
    }

    const row = rows[0];
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        req.session.user = row;
        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
    res.redirect('/recipes');
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res, next) => {
  req.session.user = null;
  req.session.save((err) => {
    if (err) return next(err);
    req.session.regenerate((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  });
};