import * as downloadService from "../../services/download.service.js";
import { getMessage } from "../../constants/messages.js";

/* -------------------------
   Error Mapper
-------------------------- */

const mapDownloadError = (err, MSG) => {
  switch (err.message) {
    case "DOWNLOAD_NOT_FOUND":
      return MSG.DOWNLOAD?.NOT_FOUND ?? MSG.GENERAL.ERROR;
    default:
      return MSG.GENERAL.ERROR;
  }
};

/* -------------------------
   Public Controllers
-------------------------- */

/**
 * GET /api/download
 */
export const listDownloadsController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const type = req.query.type ?? null;

    const downloads = await downloadService.listDownloads({ type });

    return res.json({
      ok: true,
      data: downloads,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: mapDownloadError(err, MSG),
    });
  }
};

/**
 * GET /api/download/:id
 */
export const getDownloadController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        ok: false,
        message: MSG.GENERAL.INVALID_REQUEST,
      });
    }

    const download = await downloadService.getDownloadById(id);

    return res.json({
      ok: true,
      data: download,
    });
  } catch (err) {
    return res.status(404).json({
      ok: false,
      message: mapDownloadError(err, MSG),
    });
  }
};

/**
 * GET /api/download/types
 */
export const listDownloadTypesController = async (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  try {
    const types = await downloadService.listDownloadTypes();

    return res.json({
      ok: true,
      data: types,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: MSG.GENERAL.ERROR,
    });
  }
};
