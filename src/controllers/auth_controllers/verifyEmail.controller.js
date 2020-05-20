import jsonwebtoken from "jsonwebtoken";
import sanitizeHtml from "sanitize-html";

import { jwtConfig } from "../../configs/jwt.config";
import { verifyEmail } from "../../subscribers/user.subscribers";

export default async function verify_email(req, res) {
  var jwt = req.params.jwt;

  function _validateRequestParams() {
    if (!req.params.jwt) {
      res.status(400).send({
        error_code: "ERROR_VERIFY_EMAIL_0002",
        message: "Some error occurred while verifying the email.",
        success: false,
      });
      return false;
    }
    return true;
  }

  function _sanitizeHtml() {
    jwt = sanitizeHtml(jwt);
  }

  function _verifyEmail() {
    jsonwebtoken.verify(jwt, jwtConfig.key, async function (err, decoded) {
      if (err) {
        res.status(400).send({
          error_code: "ERROR_VERIFY_EMAIL_0003",
          message: "Invalid Token.",
          success: false,
        });
        return false;
      } else {
        if (decoded.type != "emailToken") {
          res.status(400).send({
            error_code: "ERROR_VERIFY_EMAIL_0004",
            message: "Invalid Token.",
            success: false,
          });
          return false;
        } else {
          const emailVerified = await verifyEmail(decoded.id_user);
          if (emailVerified.error) {
            console.error(emailVerified.error);
            res.status(500).send({
              error_code: "ERROR_VERIFY_EMAIL_0005",
              message: "Some error occurred while verifying the email.",
              success: false,
            });
          } else {
            res.redirect(
              "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcT9JZ4ZgHiBwO_XNp-TqMS8SEId47j7W8jQNEGSsgXPzeqI3PsQ"
            );
            res.end();
          }
        }
      }
    });
  }

  try {
    const validateRequestParams = await _validateRequestParams();
    if (!validateRequestParams) return;
    await _sanitizeHtml();
    const validateEmail = await _verifyEmail();
    if (!validateEmail) return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_VERIFY_EMAIL_0001",
      message: "Some error occurred while verifying the email.",
      success: false,
    });
  }
}
