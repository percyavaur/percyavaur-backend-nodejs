import sanitizeHtml from "sanitize-html";
import jsonwebtoken, { decode } from "jsonwebtoken";

import requestService from "../../services/request.service";
import { jwtConfig } from "../../configs/jwt.config";
import * as User from "../../subscribers/user.subscribers";
import * as Person from "../../subscribers/person.subscribers";
import { server } from "../../configs/server.config";

export default async function get_user(req, res) {
  var { refreshToken } = req.cookies;
  var { authorization } = req.headers;
  var accessToken;
  function _validateTokens() {
    if (!refreshToken || !authorization) {
      res.status(400).send({
        error_code: "ERROR_GET_USER_0002",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else if (authorization.split(" ").length !== 2) {
      res.status(400).send({
        error_code: "ERROR_GET_USER_0003",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else {
      //separando el bearer del jwt
      accessToken = authorization.split(" ")[1];
      return true;
    }
  }

  function _sanitizeHtml() {
    refreshToken = sanitizeHtml(refreshToken);
    accessToken = sanitizeHtml(accessToken);
  }

  function _getUser() {
    jsonwebtoken.verify(refreshToken, jwtConfig.key, async (err, decoded) => {
      const { id_user } = decoded;

      const userData = await User.findById(id_user);
      if (userData.error) {
        console.error(userData.error);
        res.status(500).send({
          error_code: "ERROR_GET_USER_0004",
          message: "Some error occurred while getting user",
          success: false,
        });
      } else {
        const user = userData.user.dataValues;
        delete user.password;
        delete user.id_provider;
        delete user.verified;
        delete user.created_at;
        delete user.updated_at;

        const personData = await Person.findByUserId(id_user);
        if (personData.error) {
          console.error(personData.errors);
          res.status(500).send({
            error_code: "ERROR_GET_USER_0005",
            message: "Some error occurred while getting user",
            success: false,
          });
        } else {
          const person = personData.person.dataValues;
          delete person.id;
          delete person.id_user;
          delete person.created_at;
          delete person.updated_at;

          res.cookie("refreshToken", refreshToken, {
            secure: server.secure, // set to true if your using https
            httpOnly: true,
            maxAge: 30 * 1440 * 60 * 1000,
          });
          res.status(200).send({
            success: true,
            userData: { ...user, ...person },
          });
        }
      }
    });
  }

  try {
    const validateTokens = await _validateTokens();
    if (!validateTokens) return;
    await _sanitizeHtml();
    const validateRequest = await requestService(
      res,
      refreshToken,
      accessToken
    );
    if (!validateRequest) return;
    await _getUser();
    return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_GET_USER_0001",
      message: "Some error occurred while getting user",
      success: false,
    });
  }
}
