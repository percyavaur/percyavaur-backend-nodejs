import sanitizeHtml from "sanitize-html";
import moment from "moment";
import jsonwebtoken from "jsonwebtoken";

import generateToken from "../../services/jwt.service";
import { findSessionById } from "../../subscribers/session.subscribers";
import { findById } from "../../subscribers/user.subscribers";
import { jwtConfig } from "../../configs/jwt.config";

export default async function generateNewsAccessToken(req, res) {
  var { refreshToken } = req.cookies;
  function _validateCookie() {
    if (!refreshToken || refreshToken.length <= 0) {
      res.cookie("refreshToken", null, {
        maxAge: 0,
      });
      res.status(400).send({
        error_code: "ERRROR_NEW_ACCESS_TOKEN_0002",
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
        res.cookie("refreshToken", null, {
          maxAge: 0,
        });
        if (err.name == "TokenExpiredError") {
          res.status(400).send({
            error_code: "ERRROR_NEW_ACCESS_TOKEN_0003",
            message: "The token has been expired.",
            success: false,
          });
        } else if (err.name == "JsonWebTokenError") {
          res.status(400).send({
            error_code: "ERRROR_NEW_ACCESS_TOKEN_0004",
            message: "Unauthorized request, invalid token.",
            success: false,
          });
        } else {
          res.status(400).send({
            error_code: "ERRROR_NEW_ACCESS_TOKEN_0005",
            message: "Invalid Token.",
            success: false,
          });
        }
        return false;
      } else {
        if (decoded.tokenType != "refreshToken") {
          res.cookie("refreshToken", null, {
            maxAge: 0,
          });
          res.status(400).send({
            error_code: "ERRROR_NEW_ACCESS_TOKEN_0006",
            message: "Need refresh token.",
            success: false,
          });
          return false;
        } else {
          const { id_user, id_session } = decoded;
          const data_found = await findSessionById(id_session);

          if (data_found.error) {
            console.error(data_found.error);
            res.status(500).send({
              error_code: "ERRROR_NEW_ACCESS_TOKEN_0007",
              message: "Some error occurred while generating new access token.",
              success: false,
            });
            return false;
          } else {
            const { expires } = data_found.session.dataValues;
            if (expires < moment()) {
              res.cookie("refreshToken", null, {
                maxAge: 0,
              });
              res.status(409).send({
                error_code: "ERRROR_NEW_ACCESS_TOKEN_0008",
                message: "Your session has been expired.",
                important: true,
                success: false,
              });
              return false;
            } else {
              const user_found = await findById(id_user);
              if (user_found.error) {
                console.error(user_found.error);
                res.status(500).send({
                  error_code: "ERRROR_NEW_ACCESS_TOKEN_0009",
                  message:
                    "Some error occurred while generating new access token.",
                  success: false,
                });
                return false;
              } else {
                delete user_found.user.dataValues.password;
                const { id_status } = user_found.user.dataValues;
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
                  res.cookie("refreshToken", null, {
                    maxAge: 0,
                  });
                  res.status(409).send({
                    error_code: "ERRROR_NEW_ACCESS_TOKEN_0010",
                    message: `Your account has been ${status}`,
                    important: true,
                    success: false,
                  });
                  return false;
                } else {
                  const accessToken = await generateToken(
                    {
                      id_user,
                      id_session,
                      tokenType: "accessToken",
                    },
                    "accessToken"
                  );
                  res.status(200).send({
                    success: true,
                    accessToken,
                  });
                }
              }
            }
          }
        }
      }
    });
  }

  async function _newAccessToken({ id_user, id_session }) {
    const accessToken = await generateToken(
      {
        id_user,
        id_session,
        tokenType: "accessToken",
      },
      "accessToken"
    );
    res.status(200).send({
      success: true,
      accessToken,
    });
  }

  try {
    const validateCookie = await _validateCookie();
    if (!validateCookie) return;
    await _sanitizeHtml();
    const validateSession = await _validateSession();
    if (!validateSession) return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERRROR_NEW_ACCESS_TOKEN_0001",
      message: "Some error occurred while generating new access token.",
      success: false,
    });
  }
}
