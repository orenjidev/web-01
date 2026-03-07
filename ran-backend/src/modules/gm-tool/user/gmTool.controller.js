import * as gmToolService from "./gmTool.service.js";

const buildCtx = (req) => ({
  userId: req.session?.user?.userNum,
  userType: req.session?.user?.type,
  ip: req.ip,
  lang: req.lang,
});

/* =========================
   USER
========================= */

export const searchUsersController = async (req, res) => {
  const ctx = buildCtx(req);
  const result = await gmToolService.searchUsers(req.query, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

export const getUserController = async (req, res) => {
  const userNum = Number(req.params.userNum);
  const result = await gmToolService.getUser(userNum);

  if (!result.ok) {
    return res.status(404).json(result);
  }

  res.json(result);
};

export const saveUserController = async (req, res) => {
  const ctx = buildCtx(req);
  const userNum = Number(req.params.userNum);

  const result = await gmToolService.saveUser(userNum, req.body, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

/* =========================
   BLOCK / STATUS
========================= */

export const blockUserController = async (req, res) => {
  const ctx = buildCtx(req);
  const userNum = Number(req.params.userNum);
  const { until } = req.body;

  const result = await gmToolService.setUserBlock(userNum, until, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

export const chatBlockUserController = async (req, res) => {
  const ctx = buildCtx(req);
  const userNum = Number(req.params.userNum);
  const { until } = req.body;

  const result = await gmToolService.setChatBlock(userNum, until, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

export const forceOfflineController = async (req, res) => {
  const ctx = buildCtx(req);
  const userNum = Number(req.params.userNum);

  const result = await gmToolService.forceOffline(userNum, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};

/* =========================
   LOGIN LOGS
========================= */

export const getLoginLogsController = async (req, res) => {
  const userNum = Number(req.params.userNum);
  const result = await gmToolService.getLoginLogs(userNum);

  res.json(result);
};

export const clearLoginLogsController = async (req, res) => {
  const ctx = buildCtx(req);
  const userNum = Number(req.params.userNum);

  const result = await gmToolService.clearLoginLogs(userNum, ctx);

  res.json(result);
};

/* =========================
   CHARACTERS
========================= */

export const getUserCharactersController = async (req, res) => {
  const userNum = Number(req.params.userNum);
  const result = await gmToolService.getUserCharacters(userNum);

  res.json(result);
};

/* =========================
   BANK
========================= */

export const getUserBankController = async (req, res) => {
  const { userId } = req.params;
  const taken = req.query.taken === "1";
  const result = await gmToolService.getUserBank(userId, taken);

  res.json(result);
};

export const insertUserBankController = async (req, res) => {
  const { userId } = req.params;
  const { productNum, itemMain, itemSub } = req.body;

  const result = await gmToolService.insertBankItem(
    userId,
    productNum,
    itemMain,
    itemSub,
  );

  res.json(result);
};

export const clearUserBankController = async (req, res) => {
  const ctx = buildCtx(req);
  const { userId } = req.params;

  const result = await gmToolService.clearUserBank(userId, ctx);

  res.json(result);
};

export const setBankTakenController = async (req, res) => {
  const { purKey } = req.params;
  const result = await gmToolService.setBankTaken(purKey);

  res.json(result);
};

/* =========================
   TOPUP
========================= */

export const listTopupsController = async (req, res) => {
  const result = await gmToolService.listTopups();
  res.json(result);
};

export const generateTopupsController = async (req, res) => {
  const { count, value } = req.body;
  const result = await gmToolService.generateTopups(count, value);

  res.json(result);
};

export const setTopupUsedController = async (req, res) => {
  const idx = Number(req.params.idx);
  const result = await gmToolService.setTopupUsed(idx);

  res.json(result);
};

/* =========================
   REFERRAL
========================= */

export const getUserReferralsController = async (req, res) => {
  const userNum = Number(req.params.userNum);
  const result = await gmToolService.getUserReferrals(userNum);

  res.json(result);
};

/* =========================
   PCID
========================= */

export const listPcidBlocksController = async (req, res) => {
  const result = await gmToolService.listPcidBlocks();
  res.json(result);
};

export const insertPcidBlockController = async (req, res) => {
  const ctx = buildCtx(req);
  const { pcid, reason } = req.body;

  const result = await gmToolService.insertPcidBlock(pcid, reason, ctx);

  res.json(result);
};

export const deletePcidBlockController = async (req, res) => {
  const ctx = buildCtx(req);
  const idx = Number(req.params.idx);

  const result = await gmToolService.deletePcidBlock(idx, ctx);

  res.json(result);
};

export const createUserController = async (req, res) => {
  const ctx = buildCtx(req);

  const result = await gmToolService.createUser(req.body, ctx);

  if (!result.ok) {
    return res.status(403).json(result);
  }

  res.json(result);
};
