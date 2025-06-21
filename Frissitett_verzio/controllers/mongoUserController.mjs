import { mainMenu } from '../helpers/menus.mjs';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const userSchema = Joi.object({
  userName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  password1: Joi.ref('password'),
  type: Joi.string().valid('admin', 'user').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export async function isAuth(req, res, next) {
  console.log('isAuth meghívva, session user:', req.session.user);
  if (req.session.user) {
    next();
  } else {
    res.redirect('/user/login');
  }
}

export async function isAdmin(req, res, next) {
  console.log('isAdmin meghívva, session user:', req.session.user);
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

export const register = async (req, res, next) => {
  try {
    console.log('register meghívva');
    if (req.session.user) {
      res.render('message', { menu: mainMenu, user: req.session.user, message: 'Már be vagy jelentkezve!' });
    } else {
      res.render('register', {
        menu: mainMenu,
        user: req.session.user,
        userData: { userName: '', email: '', type: 'user' },
        error: null,
      });
    }
  } catch (err) {
    console.error('Hiba a register függvényben:', err);
    next(err);
  }
};

export const postRegister = async (req, res, next) => {
  console.log('postRegister meghívva, beérkező adatok:', req.body);
  const { userName, email, password, type } = req.body;

  const { error } = userSchema.validate({ userName, email, password, type });
  if (error) {
    console.log('Validációs hiba:', error.details[0].message);
    return res.status(400).render('register', {
      menu: mainMenu,
      user: req.session.user,
      userData: { userName, email, type },
      error: error.details[0].message,
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Már létező email:', email);
      return res.status(400).render('register', {
        menu: mainMenu,
        user: req.session.user,
        userData: { userName, email, type },
        error: `Ezzel az email címmel már regisztráltak: ${email}`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newUser.save();
    console.log('Új felhasználó mentve:', email);

    req.session.user = {
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.userName,
      type: newUser.type,
    };
    console.log('Session user beállítva:', req.session.user);

    res.redirect('/recipes');
  } catch (err) {
    console.error('Hiba a postRegister függvényben:', err);
    res.status(500).render('register', {
      menu: mainMenu,
      user: req.session.user,
      userData: { userName, email, type },
      error: 'Regisztrációs hiba, kérlek próbáld újra.',
    });
  }
};

export const login = async (req, res, next) => {
  try {
    console.log('login meghívva');
    if (req.session.user) {
      res.render('message', { menu: mainMenu, user: req.session.user, message: 'Már be vagy jelentkezve!' });
    } else {
      res.render('login', {
        menu: mainMenu,
        user: req.session.user,
        userData: { email: '' },
        error: null,
      });
    }
  } catch (err) {
    console.error('Hiba a login függvényben:', err);
    next(err);
  }
};

export const postLogin = async (req, res, next) => {
  console.log('postLogin meghívva, beérkező adatok:', req.body);
  const { email, password } = req.body;

  const { error } = loginSchema.validate({ email, password });
  if (error) {
    console.log('Validációs hiba:', error.details[0].message);
    return res.status(400).render('login', {
      menu: mainMenu,
      user: req.session.user,
      userData: { email },
      error: error.details[0].message,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Felhasználó nem található:', email);
      return res.status(400).render('login', {
        menu: mainMenu,
        user: req.session.user,
        userData: { email },
        error: 'Hibás email vagy jelszó.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Hibás jelszó:', email);
      return res.status(400).render('login', {
        menu: mainMenu,
        user: req.session.user,
        userData: { email },
        error: 'Hibás email vagy jelszó.',
      });
    }

    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.userName,
      type: user.type,
    };
    console.log('Session user beállítva:', req.session.user);

    res.redirect('/recipes');
  } catch (err) {
    console.error('Hiba a postLogin függvényben:', err);
    res.status(500).render('login', {
      menu: mainMenu,
      user: req.session.user,
      userData: { email },
      error: 'Bejelentkezési hiba, kérlek próbáld újra.',
    });
  }
};

export const logout = async (req, res, next) => {
  try {
    console.log('logout meghívva');
    req.session.user = null;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) return reject(err);
        req.session.regenerate((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
    res.redirect('/');
  } catch (err) {
    console.error('Hiba a logout függvényben:', err);
    next(err);
  }
};