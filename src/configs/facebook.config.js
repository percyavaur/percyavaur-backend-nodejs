import { config } from "dotenv";
config();

const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, SERVER_URL } = process.env;

export const facebookConfig = {
  clientId: FACEBOOK_APP_ID,
  clientSecret: FACEBOOK_APP_SECRET,
  redirect: `${SERVER_URL}/api/auth/facebook/callback`,
};
