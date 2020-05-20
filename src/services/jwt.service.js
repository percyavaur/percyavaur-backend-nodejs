import jwt from "jsonwebtoken";
import { jwtConfig } from "../configs/jwt.config";

export default async function generateToken(data, type) {
  var token;
  switch (type) {
    case (type = "refreshToken"):
      token = await jwt.sign(JSON.parse(JSON.stringify(data)), jwtConfig.key, {
        algorithm: jwtConfig.algorithm
      });
      break;
    case (type = "accessToken"):
      token = jwt.sign(JSON.parse(JSON.stringify(data)), jwtConfig.key, {
        algorithm: jwtConfig.algorithm,
        expiresIn: "10m",
      });
      break;
    case (type = "emailToken"):
      token = await jwt.sign(data, jwtConfig.key, {
        algorithm: jwtConfig.algorithm,
      });
      break;
    case (type = "sessionToken"):
      token = await jwt.sign(data, jwtConfig.key, {
        algorithm: jwtConfig.algorithm,
        expiresIn: "1m",
      });
      break;
  }
  return token;
}
