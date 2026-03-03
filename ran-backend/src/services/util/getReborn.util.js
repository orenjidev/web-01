// src/game/reborn/getRebornStage.js

import { baseServerConfig } from "../../config/server.config.js";

export function getRebornStage(currentReborn) {
  return (
    baseServerConfig.reborn.stages.find(
      (stage) => currentReborn >= stage.from && currentReborn <= stage.to,
    ) || null
  );
}
