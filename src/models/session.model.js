import Sequelize from "sequelize";
import { sequelize } from "../configs/database.config";

const Session = sequelize.define(
  "sessions",
  {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    id_user: { type: Sequelize.INTEGER },
    ip: { type: Sequelize.TEXT },
    expires: { type: Sequelize.DATE },
    data: { type: Sequelize.TEXT },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default Session;
