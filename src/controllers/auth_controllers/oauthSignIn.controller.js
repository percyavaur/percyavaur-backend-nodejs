import sanitizeHtml from "sanitize-html";
import jsonwebtoken from "jsonwebtoken";

import { ipValidator } from "../../tools/index";
import { jwtConfig } from "../../configs/jwt.config";
import {
  findSessionById,
  updateSession,
} from "../../subscribers/session.subscribers";
import generateToken from "../../services/jwt.service";
import { server } from "../../configs/server.config";

export default async function oauthSignIn(req, res) {
  var { authorization } = req.headers;
  var { ip } = req.body;
  var jwt;

  //Validar el authorizathion header
  function _validateRequestParams() {
    if (!authorization) {
      //Response
      res.status(400).send({
        error_code: "ERROR_VERIFY_OAUTH_SESSION_0002",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else if (authorization.split(" ").length !== 2) {
      //Response
      res.status(400).send({
        error_code: "ERROR_VERIFY_OAUTH_SESSION_0003",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else {
      //separando el bearer del jwt
      jwt = authorization.split(" ")[1];
      return true;
    }
  }

  function _sanitizeHtml() {
    jwt = sanitizeHtml(jwt);
    ip = sanitizeHtml(ip);
  }

  function _validateData() {
    if (!ipValidator(ip) || ip === "undefined") {
      res.status(400).send({
        error_code: "ERROR_VERIFY_OAUTH_SESSION_0004",
        message: "Invalid IP.",
        success: false,
      });
      return false;
    }
    return true;
  }

  function _verifySession() {
    jsonwebtoken.verify(jwt, jwtConfig.key, async function (err, decoded) {
      if (err) {
        if (err.name == "TokenExpiredError") {
          res.status(400).send({
            error_code: "ERROR_VERIFY_OAUTH_SESSION_0005",
            message: "The token has been expired.",
            success: false,
          });
        } else if (err.name == "JsonWebTokenError") {
          res.status(400).send({
            error_code: "ERROR_VERIFY_OAUTH_SESSION_0006",
            message: "Unauthorized request, invalid token.",
            success: false,
          });
        } else {
          res.status(400).send({
            error_code: "ERROR_VERIFY_OAUTH_SESSION_0007",
            message: "Invalid Token.",
            success: false,
          });
        }
        return false;
      } else {
        if (decoded.tokenType != "sessionToken") {
          res.status(400).send({
            error_code: "ERROR_VERIFY_OAUTH_SESSION_0008",
            message: "Invalid Token.",
            success: false,
          });
          return false;
        } else {
          const data_found = await findSessionById(decoded.id_session);
          if (data_found.err) {
            console.error(data_found.err);
            res.status(500).send({
              error_code: "ERROR_VERIFY_OAUTH_SESSION_0009",
              message: "Some error occurred while verifying the session.",
              success: false,
            });
          } else {
            const {
              id,
              id_user,
              expires,
              data,
            } = data_found.session.dataValues;

            const updatedSession = await updateSession({
              id,
              ip,
              expires,
              data,
            });

            if (updatedSession.error) {
              console.error(updatedSession.error);
              res.status(500).send({
                error_code: "ERROR_VERIFY_OAUTH_SESSION_0010",
                message: "Some error occurred while verifying the session.",
                success: false,
              });
            } else {
              //DESCRIPCION DE TOKENS
              //id_user para saber de quien viene la peticion
              //id_session para saber que la peticion pertenece a una session activa
              //tokenType para tener conocimiento del tipo de token

              /* El objetivo del refresh token es solo actualizar el accessToken
                pero a la vez es el de mayor tiempo de vida */
              const refreshToken = await generateToken(
                {
                  id_user,
                  id_session: id,
                  tokenType: "refreshToken",
                },
                "refreshToken"
              );
              /* El objetivo del accessToken es realizar todas las peticiones que el
                 cliente necesite , sin embargo es el de menor tiempo de vida */
              const accessToken = await generateToken(
                {
                  id_user,
                  id_session: id,
                  tokenType: "accessToken",
                },
                "accessToken"
              );
              /* Generar htpponly cookie del refreshtoken */
              res.cookie("refreshToken", refreshToken, {
                secure: server.secure, // set to true if your using https
                httpOnly: true,
                maxAge: 30 * 1440 * 60 * 1000,
              });
              //Respuesta satisfactoria
              res.status(200).send({
                accessToken,
                success: true,
                message: "Signed in successfully",
              });
            }
          }
        }
      }
    });
  }

  try {
    const validateRequestParams = await _validateRequestParams();
    if (!validateRequestParams) return;
    const validateData = await _validateData();
    if (!validateData) return;
    await _sanitizeHtml();
    await _verifySession();
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_VERIFY_OAUTH_SESSION_0001",
      message: "Some error occurred while verifying the session.",
      success: false,
    });
  }
}
