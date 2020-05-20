import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import csurf from "csurf";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import { config } from "dotenv";
config();

//import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

const app = express();

//WHITE LIST ORIGINS

const { SERVER_URL, WEB_URL, SECRET_SESSION } = process.env;

var whitelist = [SERVER_URL, WEB_URL];
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (whitelist.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { credentials: true, origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // time per window on ms
    max: 45, // limit each IP to 100 requests per windowMs
  })
);
app.use(
  session({
    secret: SECRET_SESSION,
    resave: false,
    saveUninitialized: true,
    proxy: true, // add this when behind a reverse proxy, if you need secure cookies
    cookie: {
      path: "/",
      secure: true,
      httpOnly: true
    },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
/* app.use(csurf({ cookie: true })); */

//routes
app.get("/", (req, res) => {
  res.status(200).send({
    message: "Welcome to percyavaur api!",
    success: true,
  });
});
app.use("/api/auth", cors(corsOptionsDelegate), authRoutes);
app.use("/api/user", cors(corsOptionsDelegate), userRoutes);

export default app;
