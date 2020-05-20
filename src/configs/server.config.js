import { config } from "dotenv";
config();

const { SERVER_PROTOCOL, SERVER_DOMAIN, SERVER_PORT } = process.env;

export var server = {
  protocol: SERVER_PROTOCOL,
  domain: SERVER_DOMAIN,
  port: SERVER_PORT,
  secure: SERVER_PROTOCOL === "https" ? true : false,
};
