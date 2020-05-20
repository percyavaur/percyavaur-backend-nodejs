import passport from "passport";
import moment from "moment";
import { config } from "dotenv";
import { generateSession } from "../../subscribers/session.subscribers";
import generateToken from "../../services/jwt.service";
config();

const { SERVER_URL, WEB_URL } = process.env;

export default function googleCallback(req, res, next) {
  passport.authenticate("google", function (err, user, info) {
    if (err) {
      console.error(err);
      res.status(409).send(err);
    }
    if (user) {
      googleSuccess(user, res);
    }
  })(req, res, next);
}

async function googleSuccess(user, res) {
  var newSession = {
    id_user: user.id,
    ip: null,
    expires: moment().add(1, "months").format(),
    data: "",
  };

  const generatedSession = await generateSession(newSession);
  const sessionToken = await generateToken(
    {
      id_session: generatedSession._newSession.dataValues.id,
      tokenType: "sessionToken",
    },
    "sessionToken"
  );
  res.redirect(`${WEB_URL}/#/signIn/${sessionToken}`);
}
