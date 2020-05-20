import sanitizeHtml from "sanitize-html";
import jsonwebtoken, { decode } from "jsonwebtoken";

import requestService from "../../services/request.service";
import { jwtConfig } from "../../configs/jwt.config";
import * as User from "../../subscribers/user.subscribers";
import { server } from "../../configs/server.config";

export default async function getUsersInfo(req, res) {
  var { refreshToken } = req.cookies;
  var { authorization } = req.headers;
  var { offset, limit } = req.body;

  var accessToken;

  function _validateTokens() {
    if (!refreshToken || !authorization) {
      res.status(400).send({
        error_code: "ERROR_GET_USERS_INFO_0002",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else if (authorization.split(" ").length !== 2) {
      res.status(400).send({
        error_code: "ERROR_GET_USERS_INFO_0003",
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
    offset = sanitizeHtml(offset);
    limit = sanitizeHtml(limit);
  }

  function _getUsersInfo() {
    jsonwebtoken.verify(refreshToken, jwtConfig.key, async (err, decoded) => {
      const { id_user } = decoded;

      const userData = await User.findById(id_user);
      if (userData.error) {
        console.error(userData.error);
        res.status(500).send({
          error_code: "ERROR_GET_USERS_INFO_0004",
          message: "Some error occurred while getting user",
          success: false,
        });
        return;
      } else {
        delete userData.user.dataValues.password;
        const { id_role } = userData.user.dataValues;
        if (!(id_role == 1 || id_role == 2)) {
          res.status(409).send({
            error_code: "ERROR_GET_USERS_INFO_0005",
            message: "You don't have enough privileges.",
            important: true,
            success: false,
          });
        } else {
          const usersInfo = await User.getUsersInfo(offset, limit);
          if (usersInfo.error) {
            console.error(usersInfo.error);
            res.status(500).send({
              error_code: "ERROR_GET_USERS_INFO_0006",
              message: "Some error occurred while getting user",
              success: false,
            });
          } else {
            res.cookie("refreshToken", refreshToken, {
              secure: server.secure, // set to true if your using https
              httpOnly: true,
              maxAge: 30 * 1440 * 60 * 1000,
            });
            res.status(200).send({
              success: true,
              users: usersInfo.users,
            });
          }
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
    await _getUsersInfo();
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_GET_USERS_INFO_0001",
      message: "Some error occurred while getting user",
      success: false,
    });
  }
}
