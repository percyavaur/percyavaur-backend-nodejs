import passport from "passport";
import moment from "moment";
import { config } from "dotenv";
import { generateSession } from "../../subscribers/session.subscribers";
import generateToken from "../../services/jwt.service";
config();

const { SERVER_URL, WEB_URL } = process.env;

export default function facebookCallback(req, res, next) {
  passport.authenticate("facebook", function (err, user, info) {
    if (err) {
      console.error(err);
      res.status(409).send(err);
    }
    if (user) {
      facebookSuccess(user, res);
    }
  })(req, res, next);
}

async function facebookSuccess(user, res) {
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
