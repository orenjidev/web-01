import * as serverConfigService from "../../services/serverConfig.service.js";

export const getConfigController = async (req, res) => {
  const config = await serverConfigService.getAllConfig();
  res.json({ ok: true, config });
};

export const updateConfigController = async (req, res) => {
  const { section } = req.params;
  await serverConfigService.updateConfigSection(
    section,
    req.body,
    req.ctx?.user?.userNum ?? null,
  );
  res.json({ ok: true });
};
