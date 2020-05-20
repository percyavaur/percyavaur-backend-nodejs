import jsonwebtoken from "jsonwebtoken";

import { jwtConfig } from "../configs/jwt.config";
import { findSessionById } from "../subscribers/session.subscribers";
import { findById } from "../subscribers/user.subscribers";
import moment from "moment";

export default async function requestService(res, refreshToken, accessToken) {
  var _idSRT; //idSessionRefreshToken
  var _idSAT; //idSessionAccessToken

  function _validateRefreshToken() {
    var result;
    jsonwebtoken.verify(refreshToken, jwtConfig.key, (err, decoded) => {
      if (err) {
        removeCookies(res);
        if (err.name == "TokenExpiredError") {
          res.status(400).send({
            error_code: "ERROR_REQUEST_0002",
            message: "The refresh token has been expired.",
            destroy: true,
            success: false,
          });
        } else if (err.name == "JsonWebTokenError") {
          res.status(400).send({
            error_code: "ERROR_REQUEST_0003",
            message: "Unauthorized request, invalid token.",
            destroy: true,
            success: false,
          });
        } else {
          res.status(400).send({
            error_code: "ERROR_REQUEST_0004",
            message: "Invalid Token.",
            destroy: true,
            success: false,
          });
        }
        result = false;
      } else {
        if (decoded.tokenType != "refreshToken") {
          removeCookies(res);
          res.status(400).send({
            error_code: "ERROR_REQUEST_0005",
            message: "Invalid Token.",
            destroy: true,
            success: false,
          });
          return false;
        } else {
          _idSRT = decoded.id_session;
          result = decoded;
        }
      }
    });
    return result;
  }

  async function _validateSession(decodeRT) {
    const { id_session } = decodeRT;
    var result;
    const sessionData = await findSessionById(id_session);
    if (sessionData.error) {
      console.error(sessionData.error);
      res.status(500).send({
        error_code: "ERROR_REQUEST_0006",
        message: "Some error occurred while requesting.",
        success: false,
      });
      result = false;
    } else {
      const { expires, id_user } = sessionData.session.dataValues;
      if (expires <= moment()) {
        removeCookies(res);
        res.status(409).send({
          error_code: "ERROR_REQUEST_0007",
          message: "Your session has been expired.",
          destroy: true,
          important: true,
          success: false,
        });
        result = false;
      } else {
        const userData = await findById(id_user);
        if (userData.error) {
          console.error(userData.error);
          res.status(500).send({
            error_code: "ERROR_REQUEST_0008",
            message: "Some error occurred while requesting.",
            success: false,
          });
          result = false;
        } else {
          delete userData.user.dataValues.password;
          const { id_status } = userData.user.dataValues;

          if (id_status != 1) {
            removeCookies(res);
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
            res.status(409).send({
              error_code: "ERROR_REQUEST_0009",
              message: `Your account has been ${status}`,
              destroy: true,
              important: true,
              success: false,
            });
            result = false;
          } else {
            result = true;
          }
        }
      }
    }
    return result;
  }

  function _validateAccessToken() {
    var result;
    jsonwebtoken.verify(accessToken, jwtConfig.key, (err, decoded) => {
      if (err) {
        if (err.name == "TokenExpiredError") {
          res.status(400).send({
            error_code: "ERROR_REQUEST_0010",
            message: "The access token has been expired.",
            success: false,
          });
        } else if (err.name == "JsonWebTokenError") {
          res.status(400).send({
            error_code: "ERROR_REQUEST_0011",
            message: "Unauthorized request, invalid token.",
            success: false,
          });
        } else {
          res.status(400).send({
            error_code: "ERROR_REQUEST_0012",
            message: "Invalid Token.",
            success: false,
          });
        }
        result = false;
      } else {
        if (decoded.tokenType != "accessToken") {
          removeCookies(res);
          res.status(400).send({
            error_code: "ERROR_REQUEST_0013",
            message: "Invalid Token.",
            success: false,
          });
          result = false;
        } else {
          _idSAT = decoded.id_session;
          if (_idSAT !== _idSRT) {
            removeCookies(res);
            res.status(400).send({
              error_code: "ERROR_REQUEST_0013",
              message: "Invalid Token.",
              destroy: true,
              success: false,
            });
            result = false;
          } else {
            result = true;
          }
        }
      }
    });
    return result;
  }

  try {
    const validateRT = await _validateRefreshToken();
    if (!validateRT) return false;
    const validateSession = await _validateSession(validateRT);
    if (!validateSession) return false;
    const validateAT = await _validateAccessToken();
    if (!validateAT) return false;
    return true;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_REQUEST_0001",
      message: "Some error occurred while requesting.",
      success: false,
    });
    return false;
  }
}

function removeCookies(res) {
  res.cookie("refreshToken", null, {
    maxAge: 0,
  });
}
