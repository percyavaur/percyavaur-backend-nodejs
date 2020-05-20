import sanitizeHtml from "sanitize-html";
import moment from "moment";
import jsonwebtoken from "jsonwebtoken";

import {
  findSessionById,
  updateSession,
} from "../../subscribers/session.subscribers";
import { findById } from "../../subscribers/user.subscribers";
import { jwtConfig } from "../../configs/jwt.config";
import { server } from "../../configs/server.config";

export default async function validate_admin_session(req, res) {
  var { refreshToken } = req.cookies;

  function _validateCookie() {
    if (!refreshToken || refreshToken.length <= 0) {
      removeCookies(res);
      res.status(400).send({
        error_code: "ERROR_VALIDATE_ADMIN_SESSION_0002",
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

  function _validateSession() {
    jsonwebtoken.verify(refreshToken, jwtConfig.key, async function (
      err,
      decoded
    ) {
      if (err) {
        removeCookies(res);
        if (err.name == "TokenExpiredError") {
          res.status(400).send({
            error_code: "ERROR_VALIDATE_ADMIN_SESSION_0003",
            message: "The token has been expired.",
            destroy: true,
            important: true,
            success: false,
          });
        } else if (err.name == "JsonWebTokenError") {
          res.status(400).send({
            error_code: "ERROR_VALIDATE_ADMIN_SESSION_0004",
            message: "Unauthorized request, invalid token.",
            destroy: true,
            success: false,
          });
        } else {
          res.status(400).send({
            error_code: "ERROR_VALIDATE_ADMIN_SESSION_0005",
            message: "Invalid Token.",
            destroy: true,
            success: false,
          });
        }
        return false;
      } else {
        if (decoded.tokenType != "refreshToken") {
          removeCookies(res);
          res.status(400).send({
            error_code: "ERROR_VALIDATE_ADMIN_SESSION_0006",
            message: "Need refresh token.",
            destroy: true,
            success: false,
          });
          return false;
        } else {
          const { id_user, id_session } = decoded;
          const data_found = await findSessionById(id_session);
          if (data_found.error) {
            console.error(data_found.error);
            res.status(500).send({
              error_code: "ERROR_VALIDATE_ADMIN_SESSION_0007",
              message: "Some error occurred while validating session.",
              success: false,
            });
            return false;
          } else {
            const { expires } = data_found.session.dataValues;
            if (expires < moment()) {
              removeCookies(res);
              res.status(409).send({
                error_code: "ERROR_VALIDATE_ADMIN_SESSION_0008",
                message: "Your session has been expired.",
                destroy: true,
                important: true,
                success: false,
              });
              return false;
            } else {
              const user_found = await findById(id_user);
              if (user_found.error) {
                console.error(user_found.error);
                res.status(500).send({
                  error_code: "ERROR_VALIDATE_SESSION_0009",
                  message: "Some error occurred while validating session.",
                  success: false,
                });
                return false;
              } else {
                delete user_found.user.dataValues.password;
                const { id_status, id_role } = user_found.user.dataValues;
                if (!(id_role == 1 || id_role == 2)) {
                  res.status(409).send({
                    error_code: "ERROR_VALIDATE_ADMIN_SESSION_0010",
                    message: "You don't have enough privileges.",
                    important: true,
                    success: false,
                  });
                } else {
                  if (id_status != 1) {
                    var status = "";
                    switch (id_status) {
                      case 2:
                        status = "disabled";
                        break;
                      case 3:
                        status = "banned";
                        break;
                      case 4:
                        status = "deleted";
                        break;
                    }
                    removeCookies(res);
                    res.status(409).send({
                      error_code: "ERROR_VALIDATE_ADMIN_SESSION_0011",
                      message: `Your account has been ${status}`,
                      destroy: true,
                      important: true,
                      success: false,
                    });
                    return false;
                  } else {
                    res.cookie("refreshToken", refreshToken, {
                      secure: server.secure, // set to true if your using https
                      httpOnly: true,
                      maxAge: 30 * 1440 * 60 * 1000,
                    });
                    res.status(200).send({
                      success: true,
                      message: "Your session has been validated",
                    });
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  try {
    const validateCookie = await _validateCookie();
    if (!validateCookie) return;
    await _sanitizeHtml();
    await _validateSession();
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_VALIDATE_ADMIN_SESSION_0001",
      message: "Some error occurred while validating session.",
      success: false,
    });
  }
}

function removeCookies(res) {
  res.cookie("refreshToken", null, {
    maxAge: 0,
  });
}
