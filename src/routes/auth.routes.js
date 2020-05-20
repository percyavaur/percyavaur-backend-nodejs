import { Router } from "express";
import passport from "passport";

import {
  signUp,
  signIn,
  signOut,
  googleSignIn,
  googgleCallback,
  facebookCallback,
  oauthSignin,
  verifyEmail,
  validateSession,
  validateAdmin,
  newAccessToken,
} from "../controllers/auth_controllers/index";
import strategies from "../middlewares/passport.middleware";

strategies;
const router = Router();

// .../auth/**
router.post("/signIn", signIn);

router.post("/signUp", signUp);

router.delete("/signOut", signOut);

router.get("/validateSession", validateSession);

router.get("/validateAdmin", validateAdmin);

router.get("/verifyEmail/:jwt", verifyEmail);

router.get("/newAccessToken", newAccessToken);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })
);

router.get("/google/callback", googgleCallback);

router.get("/facebook", passport.authenticate("facebook", { scope: "email" }));

router.get("/facebook/callback", facebookCallback);

router.post("/OAuth/signIn", oauthSignin);

export default router;
