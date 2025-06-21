import express from "express";
import expressLayouts from "express-ejs-layouts";
import httpStatus from "http-status-codes";
import morgan from "morgan";
import session from "express-session";
import { create } from "express-handlebars";
import pug from "pug";
import { mainMenu } from "./helpers/menus.mjs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { config } from 'dotenv';

// Környezeti változók betöltése
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Adatbázis inicializálás DB_TYPE alapján
if (process.env.DB_TYPE === 'mongodb') {
  console.log('MongoDB inicializálás');
  import('./db/mongoDbInit.mjs');
} else {
  console.log('SQLite/MySQL inicializálás');
  import('./db/dbinit.mjs');
}

// Útvonalak importálása DB_TYPE alapján
const indexRouter = process.env.DB_TYPE === 'mongodb' 
  ? (await import('./routes/mongoIndex.mjs')).router 
  : (await import('./routes/index.mjs')).router;
const userRouter = process.env.DB_TYPE === 'mongodb' 
  ? (await import('./routes/mongoUser.mjs')).router 
  : (await import('./routes/user.mjs')).router;
const recipesRouter = process.env.DB_TYPE === 'mongodb' 
  ? (await import('./routes/mongoRecipes.mjs')).router 
  : (await import('./routes/recipes.mjs')).router;

console.log('Útvonalak betöltve:', {
  indexRouter: indexRouter ? 'Definiálva' : 'Nem definiálva',
  userRouter: userRouter ? 'Definiálva' : 'Nem definiálva',
  recipesRouter: recipesRouter ? 'Definiálva' : 'Nem definiálva'
});

const app = express();

// Sablonmotor kiválasztása környezeti változó alapján
const TEMPLATE_ENGINE = process.env.TEMPLATE_ENGINE || 'ejs';
const VIEWS_DIR = TEMPLATE_ENGINE === 'pug' ? join(__dirname, 'views_pug') 
  : TEMPLATE_ENGINE === 'hbs' ? join(__dirname, 'views_hbs') 
  : join(__dirname, 'views');

app.use(morgan('dev'));

// Sablonmotor és nézetek mappa beállítása
app.set('views', VIEWS_DIR);

if (TEMPLATE_ENGINE === 'ejs') {
  app.set('view engine', 'ejs');
  app.use(expressLayouts);
  app.set('layout', 'layouts/layout');
} else if (TEMPLATE_ENGINE === 'pug') {
  app.set('view engine', 'pug');
  app.engine('pug', pug.__express);
} else if (TEMPLATE_ENGINE === 'hbs') {
  const hbs = create({
    defaultLayout: 'layouts/layout',
    extname: '.hbs',
    helpers: {
      eq: function (v1, v2, options) {
        if (v1 === v2) {
          return options.fn(this);
        }
        return options.inverse(this);
      }
    }
  });
  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
}

app.set('view cache', false);

// Middleware a form adatokhoz
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => { 
  console.log('Kérés érkezett:', req.method, req.path); 
  res.locals.path = req.path; 
  next(); 
});

// Statikus fájlok kiszolgálása
app.use('/css', express.static(join(__dirname, 'assets/css')));
app.use('/js', express.static(join(__dirname, 'assets/js')));
app.use('/images', express.static(join(__dirname, 'assets/images')));

// Fájlfeltöltés middleware
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, 'assets', 'images'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });
app.use('/recipes/edit/:id', upload.single('kep'));
app.use('/recipes/add', upload.single('kep'), (req, res, next) => {
  next();
});

// Útvonalak használata
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/recipes', recipesRouter);

// 404-es hiba kezelése
app.use((req, res) => {
  const error = httpStatus.NOT_FOUND;
  res.status(error).render('message', {
    menu: mainMenu,
    user: req.session.user,
    message: '404-es hiba. Ez a weblap nem létezik',
  });
});

// Hibakezelő middleware
app.use((err, req, res, next) => {
  console.error('Hiba:', err.message);
  const error = httpStatus.INTERNAL_SERVER_ERROR;
  res.status(error).render('message', {
    menu: mainMenu,
    user: req.session.user,
    message: '500-as hiba. Az alkalmazás hibába futott',
  });
});

export default app;