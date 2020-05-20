import Sequelize from "sequelize";
import { config } from "dotenv";
config();

const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_DIALECT } = process.env;

export const sequelize = new Sequelize(
  DB_NAME, //database name
  DB_USER, //username
  DB_PASS, //pasword
  {
    host: DB_HOST,
    dialect: DB_DIALECT,
    pool: {
      max: 5,
      min: 0,
      require: 30000,
      idle: 10000,
    },
    logging: false,
  }
);
