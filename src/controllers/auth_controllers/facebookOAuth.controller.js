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

export default async function facebookOAuth(profile) {
  try {
    const userFound = await findByEmail(profile.emails[0].value);
    const { user } = userFound;

    if (user) {
      var userData = user.dataValues;
      delete userData.password;

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
          error_code: "ERROR_FACEBOOK_OAUTH_0002",
          err: `Your account has been ${status}`,
        };
        return { err, user: null };
      } else {
        if (userData.id_provider) {
          return { err: null, user: userData };
        } else {
          userData.provider = "facebook";
          userData.id_provider = profile.id;
          userData.imageurl = `https://graph.facebook.com/${profile.id}/picture?type=large`;

          const updatedUser = await updateUser(userData);

          if (updatedUser.error) {
            const err = {
              error_code: "ERROR_FACEBOOK_OAUTH_0003",
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
      var newUser = {};
      var username = `${profile.name.givenName.split(" ")[0]}_${
        profile.name.familyName.split(" ")[0]
      }[${uid.randomUUID(13)}]`;

      var password = generator.generate({
        length: 20,
        numbers: true,
      });

      newUser.id_role = 5;
      newUser.id_status = 1;
      newUser.id_provider = profile.id;
      newUser.email = profile.emails[0].value.toLocaleLowerCase();;
      newUser.username = username.toLocaleLowerCase();;
      newUser.password = await bcrypt.hash(password, 10);
      newUser.imageurl = `https://graph.facebook.com/${profile.id}/picture?type=large`;
      newUser.provider = profile.provider;
      newUser.verified = true;

      const createdUser = await createUser(newUser);

      if (createdUser.error) {
        const err = {
          error_code: "ERROR_FACEBOOK_OAUTH_0004",
          err: createdUser.error,
        };
        return { err, user: null };
      } else {
        var newPerson = {};
        newPerson.id_user = createdUser._newUser.dataValues.id;
        newPerson.firstname = profile.name.givenName.toLocaleLowerCase();;
        newPerson.lastname = profile.name.familyName.toLocaleLowerCase();;

        const createdPerson = await createPerson(newPerson);
        if (createdPerson.error) {
          const err = {
            error_code: "ERROR_FACEBOOK_OAUTH_0005",
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
      error_code: "ERROR_FACEBOOK_OAUTH_0001",
      err: error,
    };
    return { err, user: null };
  }
}
