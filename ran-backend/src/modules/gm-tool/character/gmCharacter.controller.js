import * as gmCharacterService from "./gmCharacter.service.js";

const buildCtx = (req) => ({
  userId: req.session?.user?.userNum,
  userType: req.session?.user?.type,
  ip: req.ip,
  lang: req.lang,
});

/* =========================
   CHARACTER SEARCH
========================= */

export const searchCharactersController = async (req, res) => {
  const result = await gmCharacterService.searchCharacters(req.query);
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
};

/* =========================
   CHARACTER DETAIL
========================= */

export const getCharacterDetailController = async (req, res) => {
  const chaNum = Number(req.params.chaNum);
  if (!chaNum)
    return res.status(400).json({ ok: false, message: "INVALID_CHANUM" });

  const result = await gmCharacterService.getCharacterDetail(chaNum);
  if (!result.ok) return res.status(404).json(result);
  res.json(result);
};

/* =========================
   CHARACTER EDIT
========================= */

export const updateCharacterController = async (req, res) => {
  const ctx = buildCtx(req);
  const chaNum = Number(req.params.chaNum);

  if (!Number.isInteger(chaNum) || chaNum <= 0) {
    return res.status(400).json({ ok: false, message: "INVALID_CHANUM" });
  }

  const result = await gmCharacterService.updateCharacter(
    chaNum,
    req.body,
    ctx,
  );
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
};

// BINARY
export async function getCharacterSkills(req, res) {
  try {
    const chaNum = Number(req.params.chaNum);

    if (!Number.isInteger(chaNum) || chaNum <= 0) {
      return res.status(400).json({ error: "INVALID_CHANUM" });
    }

    const data = await gmCharacterService.getCharacterSkills(chaNum);

    if (!data) {
      return res.status(404).json({ error: "Character not found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("getCharacterSkills error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCharacterSkills(req, res) {
  try {
    const chaNum = Number(req.params.chaNum);

    if (!Number.isInteger(chaNum) || chaNum <= 0) {
      return res.status(400).json({ error: "INVALID_CHANUM" });
    }

    const { version, skills } = req.body;

    if (!version || !Array.isArray(skills)) {
      return res.status(400).json({ error: "INVALID_PAYLOAD" });
    }

    await gmCharacterService.saveCharacterSkills(chaNum, version, skills);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("updateCharacterSkills error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* =====================================================
   GET PUTON
===================================================== */

export async function getPutOnItems(req, res) {
  try {
    const chaNum = Number(req.params.chaNum);

    if (!Number.isInteger(chaNum) || chaNum <= 0) {
      return res.status(400).json({ error: "INVALID_CHANUM" });
    }

    const items = await gmCharacterService.getCharacterPutOnItems(chaNum);

    return res.json({
      ok: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("getPutOnItems error:", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/* =====================================================
   UPDATE PUTON SLOT
===================================================== */

export async function savePutOnController(req, res) {
  const chaNum = Number(req.params.chaNum);
  const { items } = req.body;

  const result = await gmCharacterService.saveCharacterPutOnItems(
    chaNum,
    items,
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json({ success: true });
}
