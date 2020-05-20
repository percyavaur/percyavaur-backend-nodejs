import "@babel/polyfill";
import app from "./app";

//config
import { server } from "./configs/server.config";

function main() {
  app.listen(process.env.PORT || 3000);
  console.log(`Server on port ${server.port}`);
}

main();
