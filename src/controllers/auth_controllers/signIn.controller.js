//modules
import sanitizeHtml from "sanitize-html";
import bcrypt from "bcrypt";
import moment from "moment";
//tools
import { ipValidator, emailValidator } from "../../tools/index";
//services
import generateToken from "../../services/jwt.service";
//subscribers
import {
  findByEmail,
  findByUsername,
} from "../../subscribers/user.subscribers";
import { generateSession } from "../../subscribers/session.subscribers";
import { server } from "../../configs/server.config";

export default async function sing_in(req, res) {
  var user = req.body;
  //Verificar si el req body es correcto
  function _validateRequestBody() {
    //Get req.body size
    var size = Object.keys(user).length;
    if (!user || size <= 0) {
      //send response
      res.status(400).send({
        error_code: "ERROR_SIGN_IN_0002",
        message: "Content can not be empty!",
        success: false,
      });
      return false;
    }
    return true;
  }
  //limpiar el req body de todo tipo de etiquetas html para evitar vulnerabilidades
  async function _sanitizeHtml() {
    user.identifier = sanitizeHtml(user.identifier).toLocaleLowerCase();
    user.password = sanitizeHtml(user.password);
    user.ip = sanitizeHtml(user.ip);
  }
  //Validacion de la informacion
  function _validateData() {
    const { identifier, password, ip } = user;
    var success = false;
    var error_name, error_code;

    if (
      identifier.length < 6 ||
      identifier.length > 254 ||
      identifier === "undefined"
    ) {
      error_name = "username or email";
      error_code = "0003";
    } else if (
      password.length < 8 ||
      password.length > 254 ||
      password === "undefined"
    ) {
      error_name = "password";
      error_code = "0004";
    } else if (!ipValidator(ip) || ip === "undefined") {
      error_name = "ip";
      error_code = "0004";
    } else {
      success = true;
    }
    //respuesta 409 - error del cliente
    switch (success) {
      case false:
        res.cookie("refreshToken", null, {
          maxAge: 0,
        });
        res.status(400).send({
          error_code: `ERROR_SIGN_IN_${error_code}`,
          message: `Invalid ${error_name}.`,
          success: false,
        });
        return false;
      default:
        return true;
    }
  }

  async function _signIn() {
    const { identifier } = user;
    //Usar el metodo correspondiente si el usuario esta usando username o email
    const userInfo = emailValidator(identifier)
      ? await findByEmail(identifier)
      : await findByUsername(identifier);

    if (userInfo.error) {
      //respuesta 500 - error del servidor
      console.error(userInfo.error);
      res.status(500).send({
        error_code: "ERROR_SIGN_IN_0005",
        message: "Some error occurred while creating the user.",
        success: false,
      });
      return false;
    } else if (!userInfo.user) {
      res.status(409).send({
        error_code: "ERROR_SIGN_IN_0006",
        message: `${identifier} doesn't exist.`,
        success: false,
      });
    } else {
      const { id_status, password } = userInfo.user.dataValues;
      const id_user = userInfo.user.dataValues.id;
      //Comparar si el estado de la cuenta está habilitada
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
        res.status(409).send({
          error_code: "ERROR_SIGN_IN_0007",
          message: `Your account has been ${status}`,
          success: false,
        });
      } else {
        //comparar contraseña de req.body y de la base de datos
        bcrypt.compare(user.password, password, async (error, result) => {
          if (error) {
            console.error(error);
            res.status(500).send({
              error_code: "ERROR_SIGN_IN_0008",
              message: "Some error occurred while signing in.",
              success: false,
            });
          } else {
            //Respues de contraseña incorrecta
            if (!result) {
              res.status(409).send({
                error_code: "ERROR_SIGN_IN_0009",
                message: "Wrong password.",
                success: false,
              });
            } else {
              //Crear objeto de la nueva session con 1 mes de expiracion
              var newSession = {
                id_user,
                ip: user.ip,
                expires: moment().add(1, "months").format(),
                data: "",
              };
              //Generar session
              const generatedSession = await generateSession(newSession);
              if (generatedSession.error) {
                console.error(generatedSession.error)
                res.status(500).send({
                  error_code: "ERROR_SIGN_IN_0010",
                  message: "Some error occurred while signing in.",
                  success: false,
                });
              } else {
                const id_session = generatedSession._newSession.dataValues.id;
                //DESCRIPCION DE TOKENS
                //id_user para saber de quien viene la peticion
                //id_session para saber que la peticion pertenece a una session activa
                //tokenType para tener conocimiento del tipo de token
                /* El objetivo del refresh token es solo actualizar el accessToken
                pero a la vez es el de mayor tiempo de vida */
                const refreshToken = await generateToken(
                  {
                    id_user,
                    id_session,
                    tokenType: "refreshToken",
                  },
                  "refreshToken"
                );
                /* El objetivo del accessToken es realizar todas las peticiones que el
                cliente necesite , sin embargo es el de menor tiempo de vida */
                const accessToken = await generateToken(
                  {
                    id_user,
                    id_session,
                    tokenType: "accessToken",
                  },
                  "accessToken"
                );
                /* Generar htpponly cookie del refreshtoken */
                res.cookie("refreshToken", refreshToken, {
                  secure: server.secure, // set to true if your using https
                  httpOnly: true,
                  maxAge: 30 * 1440 * 60 * 1000,//DIAS * HORAS * MINUTOS * MS
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
    await _signIn();
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error_code: "ERROR_SIGN_IN_0001",
      message: "Some error occurred while signing in.",
      success: false,
    });
  }
}
