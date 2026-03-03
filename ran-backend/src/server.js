import { app } from "./app.js";
import { GlobalConfig } from "./config/global.config.js";

app.listen(GlobalConfig.server.port, () => {
  console.log(
    `[BOOT] ${GlobalConfig.app.name} is Listening on ${GlobalConfig.server.port}`,
  );
});
