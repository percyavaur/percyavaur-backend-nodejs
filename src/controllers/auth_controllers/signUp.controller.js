//modules
import sanitizeHtml from "sanitize-html";
import bcrypt from "bcrypt";

//import subscribers
import {
  findByEmail,
  findByUsername,
  createUser,
  deleteUser,
} from "../../subscribers/user.subscribers";
import { createPerson } from "../../subscribers/person.subscribers";

//tools
import {
  emailValidator,
  whiteSpaceValidator,
  nameValidator,
} from "../../tools/index";

//services
import generateToken from "../../services/jwt.service";
import sendEmail from "../../services/mailer.service";

export default async function signUp(req, res) {
  var newUser = req.body;
  //validate req.body
  function _validateRequestBody() {
    //Get req.body size
    var size = Object.keys(newUser).length;
    if (!newUser || size <= 0) {
      //send response
      res.status(400).send({
        error_code: "ERROR_CREATE_USER_0002",
        message: "Content can not be empty!",
        success: false,
      });
      return false;
    }
    return true;
  }

  function _sanitizeHtml() {
    newUser.email = sanitizeHtml(newUser.email).toLocaleLowerCase();
    newUser.username = sanitizeHtml(newUser.username).toLocaleLowerCase();
    newUser.password = sanitizeHtml(newUser.password);

    newUser.firstname = sanitizeHtml(newUser.firstname).toLocaleLowerCase();
    newUser.lastname = sanitizeHtml(newUser.lastname).toLocaleLowerCase();
  }

  function _validateData() {
    const { email, username, password, firstname, lastname } = newUser;
    var success = false;
    var error_name, error_code;

    if (!emailValidator(email) || email === "undefined" || email.length > 254) {
      error_name = "email";
      error_code = "0003";
    } else if (
      !whiteSpaceValidator(username) ||
      username.length < 6 ||
      username.length > 30 ||
      username === "undefined"
    ) {
      error_name = "username";
      error_code = "0004";
    } else if (
      !whiteSpaceValidator(password) ||
      password.length < 8 ||
      password.length > 30 ||
      password === "undefined"
    ) {
      error_name = "password";
      error_code = "0005";
    } else if (!nameValidator(firstname) || firstname === "undefined") {
      error_name = "first name";
      error_code = "0006";
    } else if (!nameValidator(lastname) || lastname === "undefined") {
      error_name = "last name";
      error_code = "0007";
    } else {
      success = true;
    }

    switch (success) {
      case false:
        res.status(400).send({
          error_code: `ERROR_CREATE_USER_${error_code}`,
          message: `Invalid ${error_name}.`,
          success: false,
        });
        return false;
      default:
        return true;
    }
  }

  async function _validateEmail() {
    const { email } = newUser;
    const validateEmail = await findByEmail(email);

    if (validateEmail.error) {
      console.error(validateEmail.error);
      res.status(500).send({
        error_code: "ERROR_CREATE_USER_0008",
        message: "Some error occurred while creating the user.",
        success: false,
      });
      return false;
    } else if (validateEmail.user) {
      res.status(409).send({
        error_code: "ERROR_CREATE_USER_0009",
        message: "This email is already being used.",
        success: false,
      });
      return false;
    } else {
      return true;
    }
  }

  async function _validateUsername() {
    const { username } = newUser;
    const validateUsername = await findByUsername(username);

    if (validateUsername.error) {
      console.error(validateUsername.error);
      res.status(500).send({
        error_code: "ERROR_CREATE_USER_00010",
        message: "Some error occurred while creating the user.",
        success: false,
      });
      return false;
    } else if (validateUsername.user) {
      res.status(409).send({
        error_code: "ERROR_CREATE_USER_0011",
        message: "This username is already being used.",
        success: false,
      });
      return false;
    } else {
      return true;
    }
  }

  async function _createUser() {
    newUser.id_role = 5;
    newUser.id_status = 1;
    newUser.id_provider = null;
    newUser.password = await bcrypt.hash(newUser.password, 10);
    newUser.imageulr = null;
    newUser.provider = "native";
    newUser.verified = false;

    const createNewUser = await createUser(newUser);

    if (createNewUser.error) {
      console.error(createNewUser.error);
      res.status(500).send({
        error_code: "ERROR_CREATE_USER_00012",
        message: "Some error occurred while creating the user.",
        success: false,
      });
      return false;
    } else if (createNewUser._newUser) {
      const newPerson = {
        id_user: createNewUser._newUser.dataValues.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
      };
      const createNewPerson = await createPerson(newPerson);
      if (createNewPerson.error) {
        console.error(createNewPerson.error);
        res.status(500).send({
          error_code: "ERROR_CREATE_USER_00013",
          message: "Some error occurred while creating the user.",
          success: false,
        });
        deleteUser(createNewUser._newUser.dataValues.id);
        return false;
      } else {
        const emailToken = await generateToken(
          {
            id_user: createNewUser._newUser.dataValues.id,
            type: "emailToken",
          },
          "emailToken"
        );
        sendEmail(newUser.email, emailToken);
        res.status(200).send({
          message: "Your account has been created",
          success: true,
        });
      }
    }
  }

  try {
    const validateRequestBody = await _validateRequestBody();
    if (!validateRequestBody) return;
    await _sanitizeHtml();
    const validateData = await _validateData();
    if (!validateData) return;
    const validateEmail = await _validateEmail();
    if (!validateEmail) return;
    const validateUsername = await _validateUsername();
    if (!validateUsername) return;
    const createUser = await _createUser();
    if (!createUser) return;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_CREATE_USER_0001",
      message: "Some error occurred while creating the user.",
      success: false,
    });
  }
}
