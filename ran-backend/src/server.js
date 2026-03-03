import { app } from "./app.js";
import { GlobalConfig } from "./config/global.config.js";
import { setupWebPoolTables } from "./services/setup.service.js";
import { loadServerConfig } from "./services/serverConfig.service.js";

await setupWebPoolTables();
await loadServerConfig();

app.listen(GlobalConfig.server.port, () => {
  console.log(
    `[BOOT] ${GlobalConfig.app.name} is Listening on ${GlobalConfig.server.port}`,
  );
});
