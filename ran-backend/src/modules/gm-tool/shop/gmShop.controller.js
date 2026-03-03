import {
  getShopCategories,
  addShopCategory,
  updateShopCategory,
  getShopItems,
  addShopItem,
  updateShopItem,
  disableShopItem,
  getMysteryShopItems,
  addMysteryShopItem,
  updateMysteryShopItem,
  disableMysteryShopItem,
  getMysteryShopUserData,
  saveMysteryShopUserData,
} from "./gmShop.service.js";

const buildCtx = (req) => ({
  userId: req.session?.user?.userNum,
  ip: req.ip,
});

/* =====================================================
   SHOP CATEGORIES
===================================================== */

export async function getCategories(req, res) {
  const result = await getShopCategories();
  res.json(result);
}

export async function createCategory(req, res) {
  const result = await addShopCategory(req.body, buildCtx(req));
  res.json(result);
}

export async function patchCategory(req, res) {
  const result = await updateShopCategory(req.params.idx, req.body, buildCtx(req));
  res.json(result);
}

/* =====================================================
   SHOP ITEMS
===================================================== */

export async function getItems(req, res) {
  const result = await getShopItems();
  res.json(result);
}

export async function createItem(req, res) {
  const result = await addShopItem(req.body, buildCtx(req));
  res.json(result);
}

export async function patchItem(req, res) {
  const result = await updateShopItem(req.params.productNum, req.body, buildCtx(req));
  res.json(result);
}

export async function deleteItem(req, res) {
  const result = await disableShopItem(req.params.productNum, buildCtx(req));
  res.json(result);
}

/* =====================================================
   MYSTERY SHOP ITEMS
===================================================== */

export async function getMysteryItems(req, res) {
  const result = await getMysteryShopItems();
  res.json(result);
}

export async function createMysteryItem(req, res) {
  const result = await addMysteryShopItem(req.body, buildCtx(req));
  res.json(result);
}

export async function patchMysteryItem(req, res) {
  const result = await updateMysteryShopItem(req.params.productId, req.body, buildCtx(req));
  res.json(result);
}

export async function deleteMysteryItem(req, res) {
  const result = await disableMysteryShopItem(req.params.productId, buildCtx(req));
  res.json(result);
}

/* =====================================================
   MYSTERY SHOP USER DATA
===================================================== */

export async function getMysteryUserData(req, res) {
  const result = await getMysteryShopUserData(req.params.userNum);
  res.json(result);
}

export async function saveMysteryUserData(req, res) {
  const { blob } = req.body;
  if (!blob) return res.json({ ok: false, message: "MISSING_BLOB" });

  const result = await saveMysteryShopUserData(req.params.userNum, blob, buildCtx(req));
  res.json(result);
}
