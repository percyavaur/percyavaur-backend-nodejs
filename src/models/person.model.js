import Sequelize from "sequelize";
import { sequelize } from "../configs/database.config";

const Person = sequelize.define(
  "persons",
  {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    id_user: { type: Sequelize.INTEGER },
    firstname: { type: Sequelize.TEXT },
    lastname: { type: Sequelize.TEXT },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default Person;
