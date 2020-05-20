import Sequelize from "sequelize";
import { sequelize } from "../configs/database.config";

const UsersInfo = sequelize.define(
  "usersinfo",
  {
    id: { type: Sequelize.INTEGER, primaryKey: true},
    id_role: { type: Sequelize.INTEGER },
    id_status: { type: Sequelize.INTEGER },
    provider: { type: Sequelize.TEXT },
    email: { type: Sequelize.TEXT },
    username: { type: Sequelize.TEXT },
    verified: { type: Sequelize.BOOLEAN },
    imageurl: { type: Sequelize.TEXT },
    firstname: { type: Sequelize.TEXT },
    lastname: { type: Sequelize.TEXT },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default UsersInfo;
