import express from "express";
import expressLayouts from "express-ejs-layouts";
import httpStatus from "http-status-codes";
import morgan from "morgan";
import session from "express-session";
import { mainMenu } from "./helpers/menus.mjs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { router as indexRouter } from "./routes/index.mjs";
import { router as userRouter } from "./routes/user.mjs";
import { router as recipesRouter } from "./routes/recipes.mjs";
import multer from "multer";
import { config } from 'dotenv';
import './db/dbinit.mjs';
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(morgan("dev"));
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/layout");
app.set('view cache', false);

// Middleware a form adatokhoz
app.use(express.urlencoded({ extended: true })); // Normál form adatok
app.use(express.json()); // JSON adatok (ha szükséges)

// Session
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => { res.locals.path = req.path; next(); });

app.use("/css", express.static(join(__dirname, "assets/css")));
app.use("/js", express.static(join(__dirname, "assets/js")));
app.use("/images", express.static(join(__dirname, "assets/images")));

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
app.use('/recipes/edit/:id', upload.single('kep')); // Alkalmazd a szerkesztési útvonalra is
// Middleware a szöveges mezők és fájl feltöltés kombinálására
app.use('/recipes/add', upload.single('kep'), (req, res, next) => {
  // A multer már feldolgozta a fájlt, a szöveges mezők a req.body-ban vannak
  next();
});

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/recipes", recipesRouter);

app.use((req, res) => {
  const error = httpStatus.NOT_FOUND;
  res.status(error).render("message", {
    menu: mainMenu,
    user: req.session.user,
    message: "404-es hiba. Ez a weblap nem létezik",
  });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  const error = httpStatus.INTERNAL_SERVER_ERROR;
  res.status(error).render("message", {
    menu: mainMenu,
    user: req.session.user,
    message: "500-as hiba. Az alkalmazás hibába futott",
  });
});

export default app;