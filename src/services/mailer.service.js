import nodemailer from "nodemailer";
import { server } from "../configs/server.config";
import { config } from "dotenv";
config();

const {
  MAILER_EMAIL,
  MAILER_CLIENTID,
  MAILER_CLIENTSECRET,
  MAILER_REFRESHTOKEN,
  MAILER_ACCESSTOKEN,
} = process.env;

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: MAILER_EMAIL,
    clientId: MAILER_CLIENTID,
    clientSecret: MAILER_CLIENTSECRET,
    refreshToken: MAILER_REFRESHTOKEN,
    accessToken: MAILER_ACCESSTOKEN,
  },
});

function sendEmail(email, emailToken) {
  var verifyUrl = `${server.protocol}://${server.domain}/api/auth/verifyEmail/${emailToken}`;
  var mailOptions = {
    from: MAILER_EMAIL,
    to: email,
    subject: "Email verifier no-reply",
    text: `Please verify your email: ${verifyUrl}`,
    //html: {path: './views/email_verifier.html'}
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error(error);
    } else {
      console.log(`Email sent to: ${mailOptions.to}`);
      console.log(info);
    }
  });
}

export default sendEmail;
