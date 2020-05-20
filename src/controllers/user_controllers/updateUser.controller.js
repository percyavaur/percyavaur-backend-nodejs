import sanitizeHtml from "sanitize-html";
import jsonwebtoken from "jsonwebtoken";

//import subscribers
import requestService from "../../services/request.service";
import { findByUsername_V2, updateUser } from "../../subscribers/user.subscribers";
import { updatePerson } from "../../subscribers/person.subscribers";
import { jwtConfig } from "../../configs/jwt.config";
import { server } from "../../configs/server.config";

import {
  whiteSpaceValidator,
  urlValidator,
  nameValidator,
} from "../../tools/index";

export default async function update_user(req, res) {
  var { refreshToken } = req.cookies;
  var { authorization } = req.headers;
  var newUserData = req.body;
  var accessToken;

  function _validateTokens() {
    if (!refreshToken || !authorization) {
      res.status(400).send({
        error_code: "ERROR_UPDATE_USER_0002",
        message: "Unauthorized request.",
        success: false,
      });
      return false;
    } else if (authorization.split(" ").length !== 2) {
      res.status(400).send({
        error_code: "ERROR_UPDATE_USER_0003",
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
    var size = Object.keys(newUserData).length;
    if (!newUserData || size <= 0) {
      //send response
      res.status(400).send({
        error_code: "ERROR_UPDATE_USER_0004",
        message: "Content can not be empty!",
        success: false,
      });
      return false;
    }
    return true;
  }

  function _sanitizeHtml() {
    refreshToken = sanitizeHtml(refreshToken);
    accessToken = sanitizeHtml(accessToken);

    newUserData.username = sanitizeHtml(
      newUserData.username
    ).toLocaleLowerCase();
    newUserData.imageurl = sanitizeHtml(newUserData.imageurl);
    newUserData.firstname = sanitizeHtml(
      newUserData.firstname
    ).toLocaleLowerCase();
    newUserData.lastname = sanitizeHtml(
      newUserData.lastname
    ).toLocaleLowerCase();
  }

  function _validateData() {
    newUserData.imageurl =
      newUserData.imageurl === "undefined" ? null : newUserData.imageurl;

    var { username, imageurl, firstname, lastname } = newUserData;

    var success = false;
    var error_name, error_code;

    if (
      !whiteSpaceValidator(username) ||
      username.length < 6 ||
      username.length > 30 ||
      username === "undefined"
    ) {
      error_name = "username";
      error_code = "0005";
    } else if (!nameValidator(firstname) || firstname === "undefined") {
      error_name = "first name";
      error_code = "0006";
    } else if (!nameValidator(lastname) || lastname === "undefined") {
      error_name = "last name";
      error_code = "0007";
    } else {
      if (imageurl) {
        if (!urlValidator(newUserData.imageurl)) {
          error_name = "image";
          error_code = "0008";
        } else {
          success = true;
        }
      }
    }

    switch (success) {
      case false:
        res.status(400).send({
          error_code: `ERROR_UPDATE_USER_${error_code}`,
          message: `Invalid ${error_name}.`,
          success: false,
        });
        return false;
      default:
        return true;
    }
  }

  async function _validateUsername(id) {
    const { username } = newUserData;
    const validateUsername = await findByUsername_V2(username, id);

    if (validateUsername.error) {
      console.error(validateUsername.error);
      res.status(500).send({
        error_code: "ERROR_CREATE_USER_0009",
        message: "Some error occurred while updating the user.",
        success: false,
      });
      return false;
    } else if (validateUsername.user) {
      res.status(409).send({
        error_code: "ERROR_CREATE_USER_0010",
        message: "This username is already being used.",
        success: false,
      });
      return false;
    } else {
      return true;
    }
  }

  async function _updateUser() {
    jsonwebtoken.verify(refreshToken, jwtConfig.key, async function (
      err,
      decoded
    ) {
      const { id_user } = decoded;

      const validateUsername = await _validateUsername(id_user);
      if (!validateUsername) {
        return false;
      } else {
        const queryUser = await updateUser({ id: id_user, ...newUserData });
        if (queryUser.error) {
          console.error(queryUser.error);
          res.status(500).send({
            error_code: "ERROR_UPDATE_USER_0011",
            message: "Some error occurred while updating the user.",
            success: false,
          });
          return false;
        } else {
          const queryPerson = await updatePerson({ id_user, ...newUserData });
          if (queryPerson.error) {
            console.log(queryPerson.error);
            res.status(500).send({
              error_code: "ERROR_UPDATE_USER_0012",
              message: "Some error occurred while updating the user.",
              success: false,
            });
            return false;
          } else {
            const user = queryUser.user.dataValues;
            const person = queryPerson.person.dataValues;

            delete user.id;
            delete user.id_provider;
            delete user.verified;
            delete user.created_at;
            delete user.updated_at;
            delete user.password;

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
              message: "Your account has been updated",
              user: { ...user, ...person },
            });
          }
        }
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
    await _sanitizeHtml();
    const validateData = await _validateData();
    if (!validateData) return;
    const updateUser = await _updateUser();
    if (!updateUser) return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_UPDATE_USER_0001",
      message: "Some error occurred while updating the user.",
      success: false,
    });
  }
}

function removeCookies(res) {
  res.cookie("refreshToken", null, {
    maxAge: 0,
  });
}
