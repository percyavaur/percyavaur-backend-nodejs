import Sequelize from "sequelize";
import { sequelize } from "../configs/database.config";
import Person from "./person.model";
import Session from "./session.model";

const User = sequelize.define(
  "users",
  {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    id_role: { type: Sequelize.INTEGER },
    id_status: { type: Sequelize.INTEGER },
    id_provider: { type: Sequelize.TEXT },
    email: { type: Sequelize.TEXT },
    username: { type: Sequelize.TEXT },
    password: { type: Sequelize.TEXT },
    imageurl: { type: Sequelize.TEXT },
    provider: { type: Sequelize.TEXT },
    verified: { type: Sequelize.BOOLEAN },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

User.hasOne(Person, { foreignKey: "id_user", sourceKey: "id" });
User.hasMany(Session, { foreignKey: "id_user", sourceKey: "id" });
Person.belongsTo(User, { foreignKey: "id_user", sourceKey: "id" });
Session.belongsTo(User, { foreignKey: "id_user", sourceKey: "id" });

export default User;
