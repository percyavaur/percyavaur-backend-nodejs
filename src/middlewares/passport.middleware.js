import passport from "passport";
import passportStrategy from "passport-google-oauth2";
import facebookStrategy from "passport-facebook";

import { googleConfig } from "../configs/google.config";
import { facebookConfig } from "../configs/facebook.config";
import {
  googleOAuth,
  facebookOAuth,
} from "../controllers/auth_controllers/index";
import { findById } from "../subscribers/user.subscribers";

const GoogleStrategy = passportStrategy.Strategy;
const FacebookStrategy = facebookStrategy.Strategy;

/* GOOGLE PASSPORT STRATEGY */
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.redirect,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      const OAuth = await googleOAuth(profile);
      if (OAuth.err) {
        done(OAuth.err, null);
      } else {
        done(null, OAuth.user);
      }
    }
  )
);

/* FACEBOOK PASSPORT STRATEGY */
passport.use(
  "facebook",
  new FacebookStrategy(
    {
      clientID: facebookConfig.clientId,
      clientSecret: facebookConfig.clientSecret,
      callbackURL: facebookConfig.redirect,
      profileFields: ["id", "name", "email"],
    },
    async function (accessToken, refreshToken, profile, done) {
      const OAuth = await facebookOAuth(profile);
      if (OAuth.err) {
        done(OAuth.err, null);
      } else {
        done(null, OAuth.user);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  const findUser = await findById(id);
  done(findUser.error, findUser.user.dataValues);
  if (findUser.error) {
    done(findUser.error, null);
  } else {
    delete findUser.user.dataValues.password;
    done(null, findUser.user.dataValues);
  }
});
