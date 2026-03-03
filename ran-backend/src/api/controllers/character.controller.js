import { baseServerConfig } from "../../config/server.config.js";
import * as characterFunc from "../../services/character.service.js";
import { getMessage } from "../../constants/messages.js";

/* -------------------------
   Helpers
-------------------------- */

const mapCharacterError = (err, MSG) => {
  switch (err.message) {
    case "INVALID_BODY":
    case "INVALID_REQUEST":
      return MSG.GENERAL.INVALID_BODY;

    case "INVALID_SCHOOL":
    case "INVALID_CLASS":
      return MSG.CHARACTER.INVALID_SELECTION;

    case "SAME_SCHOOL":
    case "SAME_CLASS":
      return MSG.CHARACTER.NO_CHANGE;

    case "CHARACTER_NOT_FOUND":
      return MSG.CHARACTER.NOT_FOUND;

    case "CHARACTER_ONLINE":
      return MSG.CHARACTER.MUST_BE_OFFLINE;

    case "USER_MISMATCH":
    case "UNAUTHORIZED":
      return MSG.AUTH.UNAUTHORIZED;

    case "INSUFFICIENT_CHAMONEY":
    case "INSUFFICIENT_USERPOINT":
    case "INSUFFICIENT_CURRENCY":
    case "NOT_ENOUGH_GOLD":
      return MSG.CHARACTER.INSUFFICIENT_FUNDS;

    case "LEVEL_REQUIREMENT_NOT_MET":
      return MSG.CHARACTER.LEVEL_REQUIREMENT_NOT_MET;

    case "MAX_REBORN_REACHED":
      return MSG.CHARACTER.MAX_REBORN_REACHED;

    default:
      return MSG.GENERAL.ERROR;
  }
};

/* -------------------------
   Ranking
-------------------------- */

export const getCharacterRankingController = async (req, res) => {
  const MSG = getMessage(req.ctx?.lang);

  try {
    const quantity = Math.min(Number(req.query.quantity) || 100, 500);
    const filter = String(req.query.ctg || "").toLowerCase();

    const data = await characterFunc.getCharacterRanking(quantity, filter);

    return res.json({
      ok: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.CHARACTER.RANKING_FAILED,
    });
  }
};

/* -------------------------
   Change School
-------------------------- */

export const changeCharacterSchoolController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.changeSchool.enabled) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.CHANGE_SCHOOL_DISABLED,
    });
  }

  try {
    const { characterId, school } = req.body;

    if (!characterId || !school) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_BODY,
      });
    }

    await characterFunc.changeCharacterSchool(
      characterId,
      school,
      req.ctx.user,
    );

    return res.json({
      ok: true,
      message: MSG.CHARACTER.SCHOOL_CHANGED,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapCharacterError(err, MSG),
    });
  }
};

/* -------------------------
   Reset Stats
-------------------------- */

export const resetStatsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.resetStats.enabled) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.RESET_STATS_DISABLED,
    });
  }

  try {
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_BODY,
      });
    }

    await characterFunc.resetCharacterStat(characterId, req.ctx.user);

    return res.json({
      ok: true,
      message: MSG.CHARACTER.STATS_RESET,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapCharacterError(err, MSG),
    });
  }
};

/* -------------------------
   Change Class
-------------------------- */

export const changeCharacterClassController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.changeClass?.enabled) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.CHANGE_CLASS_DISABLED,
    });
  }

  try {
    const { characterId, class: newClass } = req.body;

    if (!characterId || !newClass) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_BODY,
      });
    }

    await characterFunc.changeCharacterClass(
      characterId,
      newClass,
      req.ctx.user,
    );

    return res.json({
      ok: true,
      message: MSG.CHARACTER.CLASS_CHANGED,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapCharacterError(err, MSG),
    });
  }
};

/* -------------------------
   My Characters
-------------------------- */

export const getMyCharactersController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const characters = await characterFunc.getCharactersByUserId(
      req.ctx.user.userNum,
    );

    if (!characters.length) {
      return res.status(404).json({
        ok: false,
        message: MSG.CHARACTER.NO_CHARACTERS,
      });
    }

    return res.json({
      ok: true,
      characters,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.CHARACTER.FETCH_FAILED,
    });
  }
};

/* -------------------------
   Reborn
-------------------------- */

export const rebornController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.reborn?.enabled) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.REBORN_DISABLED,
    });
  }

  try {
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_BODY,
      });
    }

    await characterFunc.rebornCharacter(characterId, req.ctx);

    return res.json({
      ok: true,
      message: MSG.CHARACTER.REBORN_SUCCESS,
    });
  } catch (err) {
    console.error("REBORN ERROR:", err);

    return res.status(400).json({
      ok: false,
      message: mapCharacterError(err, MSG),
    });
  }
};

export const rebornPreviewController = async (req, res) => {
  try {
    const { characterId } = req.query;

    const data = await characterFunc.getRebornPreview(characterId, req.ctx);

    return res.json({
      ok: true,
      data,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

/* -------------------------
   Delete Character
-------------------------- */

export const deleteCharacterController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.features.characterDelete) {
    return res.status(403).json({
      ok: false,
      message: MSG.FEATURE.CHARACTER_DELETE_DISABLED,
    });
  }

  try {
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_BODY,
      });
    }

    await characterFunc.deleteCharacter(characterId, req.ctx.user);

    return res.json({
      ok: true,
      message: MSG.CHARACTER.DELETED,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      message: mapCharacterError(err, MSG),
    });
  }
};
