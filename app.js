import express, { json, urlencoded } from "express";
import 'express-async-errors'; // catch async errors in the error handling middleware
import cookieParser from "cookie-parser";
import logger from "morgan";
import path from "path";
import { fileURLToPath } from 'url';
import session from "express-session"; //ha bejelentkezunk, akkor ugy is marad
import passport from "passport";
import "./controllers/loginController.js";

// import routers
import errorHandler from "./middlewares/error-handler.js";
import undefinedPage from "./middlewares/undefined-page.js";
import login from "./routes/login.js";
import register from "./routes/register.js";
import home from "./routes/home.js";
import search from "./routes/search.js";
import user from "./routes/user.js";
import admin from "./routes/admin.js";
import recipe from "./routes/recipe.js"

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// express setup
app.use(logger('dev')); // log every request
app.use(json()); // parse request body JSON
app.use(urlencoded({ extended: false })); // parse request body as urlencoded data
app.use(cookieParser()); // parses cookies, set: res.cookie("name", "value"), get: req.cookies
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret:"jkfvduysvfobeodbfavfoabiyvfweougbbveuo",
    resave:false,
    saveUninitialized:false,
}));
app.use(passport.initialize());
app.use(passport.session());

// set routes
app.use('/', home);
app.use('/login', login);
app.use('/register',register);
app.use('/search',search);
app.use('/user',user);
app.use('/admin',admin);
app.use('/recipe', recipe)

// if none of the above match, catch 404 and forward to error handler
app.use(undefinedPage);

// error handler
app.use(errorHandler);

export default app;