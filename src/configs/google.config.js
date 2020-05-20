import { config } from "dotenv";
config();

const { GOOGLE_CLIENTID, GOOGLE_CLIENTSECRET,SERVER_URL } = process.env;

export const googleConfig = {
  clientId: GOOGLE_CLIENTID,
  clientSecret: GOOGLE_CLIENTSECRET,
  redirect: `${SERVER_URL}/api/auth/google/callback`,
};
