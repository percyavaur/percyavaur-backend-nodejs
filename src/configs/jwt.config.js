import { config } from "dotenv";
config();

const { JWT_KEY, JWT_ALGORITHM } = process.env;

export const jwtConfig = {
  key: JWT_KEY,
  accessTokenLife: "30m",
  refreshTokenLife: "8h",
  algorithm: JWT_ALGORITHM,
};
