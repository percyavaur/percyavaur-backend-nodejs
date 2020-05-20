import ShortUniqueId from "short-unique-id";
import generator from "generate-password";
import bcrypt from "bcrypt";

import {
  findByEmail,
  updateUser,
  createUser,
  deleteUser,
} from "../../subscribers/user.subscribers";
import { createPerson } from "../../subscribers/person.subscribers";

const uid = new ShortUniqueId();

export default async function googleOAuth(profile) {
  try {
    /* Buscar usario por email para verificar si ya tiene 
    uno asociando con la misma direccion */
    const queryInfo = await findByEmail(profile.email);
    const { user } = queryInfo;
    /* Actualizar el usuario si este ya tiene el mismo email */
    if (user) {
      var userData = user.dataValues;
      delete userData.password;
      /*  Validar si el usario esta habilitado */
      if (userData.id_status != 1) {
        var status = "";
        switch (userData.id_status) {
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
        const err = {
          error_code: "ERROR_GOOGLE_OAUTH_0002",
          err: `Your account has been ${status}`,
        };
        return { err, user: null };
      } else {
        /* Si el usuario ya tiene un id_provider no hay necesidad
      de actualizarlo de nuevo */
        if (userData.id_provider) {
          return { err: null, user: userData };
        } else {
          userData.provider = profile.provider.toLocaleLowerCase();;
          userData.id_provider = profile.id;
          userData.imageurl = profile.photos[0].value;

          const updatedUser = await updateUser(userData);

          if (updatedUser.error) {
            const err = {
              error_code: "ERROR_GOOGLE_OAUTH_0003",
              err: updatedUser.error,
            };
            return { err, user: null };
          } else {
            /* Siempre rotarnar los valores del usuario y no de la persona */
            var { dataValues } = updatedUser.user;
            return { err: null, user: dataValues };
          }
        }
      }
    } else {
      /* Crear un usuario si es que su email no existe*/
      var newUser = {};
      var username = `${profile.given_name.split(" ")[0]}_${
        profile.family_name.split(" ")[0]
      }[${uid.randomUUID(13)}]`;

      var password = generator.generate({
        length: 20,
        numbers: true,
      });

      /*Crear un nuevo usuario con la informacion del profile*/
      newUser.id_role = 5;
      newUser.id_status = 1;
      newUser.id_provider = profile.id;
      newUser.email = profile.email.toLocaleLowerCase();;
      newUser.username = username.toLocaleLowerCase();;
      newUser.password = await bcrypt.hash(password, 10);
      newUser.imageurl = profile.photos[0].value;
      newUser.provider = profile.provider;
      newUser.verified = true;

      const createdUser = await createUser(newUser);

      if (createdUser.error) {
        const err = {
          error_code: "ERROR_GOOGLE_OAUTH_0004",
          err: createdUser.error,
        };
        return { err, user: null };
      } else {
        /* Crear persona con la informacion del profile */
        var newPerson = {};
        newPerson.id_user = createdUser._newUser.dataValues.id;
        newPerson.firstname = profile.given_name.toLocaleLowerCase();;
        newPerson.lastname = profile.family_name.toLocaleLowerCase();;
        const createdPerson = await createPerson(newPerson);
        if (createdPerson.error) {
          const err = {
            error_code: "ERROR_GOOGLE_OAUTH_0005",
            err: createdPerson.error,
          };
          /* Borrar el usuario si createPerson genera un error */
          await deleteUser(createdUser._newUser.dataValues.id);
          return { err, user: null };
        } else {
          /* Siempre rotarnar los valores del usuario y no de la persona */
          return { err: null, user: createdUser._newUser.dataValues };
        }
      }
    }
  } catch (error) {
    console.error(error);
    const err = {
      error_code: "ERROR_GOOGLE_OAUTH_0001",
      err: error,
    };
    return { err, user: null };
  }
}
