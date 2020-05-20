import User from "../models/user.model";
import UsersInfo from "../models/usersInfo.model";
import Sequelize from "sequelize";
const Op = Sequelize.Op;

export async function findByEmail(email) {
  try {
    const user = await User.findOne({ where: { email } });
    if (user) {
      return { error: false, user };
    }
    return { error: false, user: null };
  } catch (error) {
    return { error };
  }
}

export async function findByUsername(username) {
  try {
    const user = await User.findOne({
      where: { username },
    });
    if (user) {
      return { error: false, user };
    }
    return { error: false, user: null };
  } catch (error) {
    return { error, user: null };
  }
}

export async function findByUsername_V2(username, id) {
  try {
    const user = await User.findOne({
      where: { username, id: { [Op.ne]: id } },
    });
    if (user) {
      return { error: false, user };
    }
    return { error: false, user: null };
  } catch (error) {
    return { error, user: null };
  }
}

export async function findById(id) {
  try {
    const user = await User.findOne({ where: { id } });
    if (user) {
      return { error: false, user };
    }
    return { error: false, user: null };
  } catch (error) {
    return { error, user: null };
  }
}

export async function createUser(newUser) {
  const {
    id_role,
    id_status,
    id_provider,
    email,
    username,
    password,
    imageurl,
    provider,
    verified,
  } = newUser;

  try {
    let _newUser = await User.create(
      {
        id_role,
        id_status,
        id_provider,
        email,
        username,
        password,
        imageurl,
        provider,
        verified,
      },
      {
        fields: [
          "id_role",
          "id_status",
          "id_provider",
          "email",
          "username",
          "password",
          "imageurl",
          "provider",
          "verified",
        ],
      }
    );
    if (_newUser) {
      return { error: false, _newUser };
    } else {
      return { error: true, _newUser: null };
    }
  } catch (error) {
    return { error, _newUser: null };
  }
}

export async function deleteUser(id) {
  try {
    const user = await User.destroy({ where: { id } });
    if (user) {
      return { error: false, user };
    } else {
      return { error: true, user: null };
    }
  } catch (error) {
    return { error, user: null };
  }
}

export async function updateUser(newUserData) {
  try {
    const {
      id,
      id_role,
      id_status,
      id_provider,
      email,
      username,
      imageurl,
      provider,
    } = newUserData;

    var user = await User.findOne({ where: { id } });

    user.id_role = !id_role ? user.id_role : id_role;
    user.id_status = !id_status ? user.id_status : id_status;
    user.id_provider = !id_provider ? user.id_provider : id_provider;
    user.email = !email ? user.email : email;
    user.username = !username ? user.username : username;
    user.imageurl = !imageurl ? user.imageurl : imageurl;
    user.provider = !provider ? user.provider : provider;

    const updateUser = await user.save();

    if (updateUser) {
      return { error: false, user: updateUser };
    } else {
      return { error: true, user: null };
    }
  } catch (error) {
    return { error, user: null };
  }
}

export async function updatePassword(id, password) {
  try {
    var user = await User.findOne({ where: { id } });

    user.password = password;

    const updatePassword = await user.save();

    if (updatePassword) {
      return { error: false, user: true };
    } else {
      return { error: true, user: null };
    }
  } catch (error) {
    return { error, user: null };
  }
}

export async function getUsersInfo(offset, limit) {
  try {
    const users = await UsersInfo.findAll({
      raw: true,
      offset,
      limit,
      order: [["id", "DESC"]],
    });
    if (users) {
      return { error: false, users };
    }
    return { error: false, users: null };
  } catch (error) {
    return { error, users: null };
  }
}

export async function verifyEmail(id) {
  try {
    var user = await User.findOne({
      where: { id },
    });

    user.verified = true;
    const updateUser = await user.save({ raw: true });

    if (updateUser) {
      return { error: false, user: updateUser };
    } else {
      return { error: true, user: null };
    }
  } catch (error) {
    return { error, user: null };
  }
}
