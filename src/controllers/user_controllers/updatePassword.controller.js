import sanitizeHtml from "sanitize-html";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";

//import subscribers
import requestService from "../../services/request.service";
import { findById, updatePassword } from "../../subscribers/user.subscribers";
import { updatePerson } from "../../subscribers/person.subscribers";
import { jwtConfig } from "../../configs/jwt.config";
import { server } from "../../configs/server.config";

import {
  whiteSpaceValidator,
  urlValidator,
  nameValidator,
} from "../../tools/index";

export default async function update_password(req, res) {
  var { refreshToken } = req.cookies;
  var { authorization } = req.headers;
  var user = req.body;
  var accessToken;

  function _validateTokens() {
    if (!refreshToken || !authorization) {
      res.status(400).send({
        error_code: "ERROR_UPDATE_PASSWORD_0002",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else if (authorization.split(" ").length !== 2) {
      res.status(400).send({
        error_code: "ERROR_UPDATE_PASSWORD_0003",
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

  function _validateRequestBody() {
    //Get req.body size
    var size = Object.keys(user).length;
    if (!user || size <= 0) {
      //send response
      res.status(400).send({
        error_code: "ERROR_UPDATE_PASSWORD_0004",
        message: "Content can not be empty!",
        success: false,
      });
      return false;
    }
    return true;
  }

  function _sanitizeHtml() {
    user.password = sanitizeHtml(user.password);
    user.newpassword = sanitizeHtml(user.newpassword);
  }

  function _validateData() {
    const { newpassword } = newUser;
    var success = false;
    var error_name, error_code;

    if (
      !whiteSpaceValidator(newpassword) ||
      newpassword.length < 8 ||
      newpassword.length > 30 ||
      newpassword === "undefined"
    ) {
      error_name = "new password";
      error_code = "0005";
    } else {
      success = true;
    }

    switch (success) {
      case false:
        res.status(400).send({
          error_code: `ERROR_UPDATE_PASSWORD_${error_code}`,
          message: `Invalid ${error_name}.`,
          success: false,
        });
        return false;
      default:
        return true;
    }
  }

  async function _updatePassword() {
    jsonwebtoken.verify(refreshToken, jwtConfig.key, async function (
      err,
      decoded
    ) {
      const { id_user } = decoded;

      const _findById = await findById(id_user);

      if (_findById.error) {
        console.error(_findById.error);
        res.status(500).send({
          error_code: "ERROR_UPDATE_PASSWORD_0006",
          message: "Some error occurred while updating password.",
          success: false,
        });
        return false;
      } else {
        const { password } = _findById.user.dataValues;
        bcrypt.compare(user.password, password, async (error, result) => {
          if (error) {
            console.error(error);
            res.status(500).send({
              error_code: "ERROR_UPDATE_PASSWORD_0007",
              message: "Some error occurred while updating password.",
              success: false,
            });
            return false;
          } else {
            if (!result) {
              res.status(409).send({
                error_code: "ERROR_UPDATE_PASSWORD_0008",
                message: "Wrong password.",
                success: false,
              });
              return false;
            } else {
              var newpassword = await bcrypt.hash(user.password, 10);
              const _updatePassword = await updatePassword(
                id_user,
                newpassword
              );
              if (_updatePassword.error) {
                console.error(_updatePassword.error);
                res.status(500).send({
                  error_code: "ERROR_UPDATE_PASSWORD_0009",
                  message: "Some error occurred while updating password.",
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
                  message: "Your password has been updated",
                });
              }
            }
          }
        });
      }
    });
  }

  try {
    const validateTokens = await _validateTokens();
    if (!validateTokens) return;
    const validateRequestBody = await _validateRequestBody();
    if (!validateRequestBody) return;
    const validateRequest = await requestService(
      res,
      refreshToken,
      accessToken
    );
    if (!validateRequest) return;
    const validateData = await _validateData();
    if (!validateData) return;
    await _sanitizeHtml();
    const updatePassword = await _updatePassword();
    if (!updatePassword) return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_UPDATE_PASSWORD_0001",
      message: "Some error occurred while updating password.",
      success: false,
    });
  }
}

function removeCookies(res) {
  res.cookie("refreshToken", null, {
    maxAge: 0,
  });
}
