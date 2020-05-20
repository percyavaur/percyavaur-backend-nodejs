import sanitizeHtml from "sanitize-html";
import jsonwebtoken from "jsonwebtoken";
import moment from "moment";

import { jwtConfig } from "../../configs/jwt.config";
import { updateSession } from "../../subscribers/session.subscribers";

export default async function signOut(req, res) {
  var { refreshToken } = req.cookies;

  function _validateCookie() {
    if (!refreshToken || refreshToken.length <= 0) {
      res.status(400).send({
        error_code: "ERROR_SIGN_OUT_0002",
        message: "Need refresh token.",
        success: false,
      });
      return false;
    }
    return true;
  }

  function _sanitizeHtml() {
    refreshToken = sanitizeHtml(refreshToken);
  }

  function _validateRefreshToken() {
    jsonwebtoken.verify(refreshToken, jwtConfig.key, async function (
      err,
      decoded
    ) {
      if (err) {
        res.cookie("refreshToken", null, {
          maxAge: 0,
        });
        if (err.name == "TokenExpiredError") {
          res.status(400).send({
            error_code: "ERROR_SIGN_OUT_0003",
            message: "The token has been expired.",
            success: false,
          });
        } else if (err.name == "JsonWebTokenError") {
          res.status(400).send({
            error_code: "ERROR_SIGN_OUT_0004",
            message: "Unauthorized request, invalid token.",
            success: false,
          });
        } else {
          res.status(400).send({
            error_code: "ERROR_SIGN_OUT_0005",
            message: "Invalid Token.",
            success: false,
          });
        }
        return false;
      } else {
        if (decoded.tokenType != "refreshToken") {
          res.status(400).send({
            error_code: "ERROR_SIGN_OUT_0006",
            message: "Need refresh token.",
            success: false,
          });
          return false;
        } else {
          const newSessionData = {
            id: decoded.id_session,
            expires: moment(), //expira ahora mismo
          };
          const singOut = updateSession(newSessionData);
          if (singOut.error) {
            console.error(singOut.error);
            res.status(500).send({
              error_code: "ERROR_SIGN_OUT_0007",
              message: "Some error occurred while signing out",
              success: false,
            });
          } else {
            /* Borrar refreshToken y accessToken */
            res.cookie("refreshToken", null, {
              maxAge: 0,
            });
            res.status(200).send({
              success: true,
              message: "Signed out successfully",
            });
          }
        }
      }
    });
  }

  try {
    const validateCookie = await _validateCookie();
    if (!validateCookie) return;
    await _sanitizeHtml();
    await _validateRefreshToken();
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_SIGN_OUT_0001",
      message: "Some error occurred while signing out",
      success: false,
    });
  }
}
