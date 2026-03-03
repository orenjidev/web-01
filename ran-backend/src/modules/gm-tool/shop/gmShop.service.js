import sql from "mssql";
import { getShopPool, getGamePool } from "../../../loaders/mssql.js";
/* =====================================================
   SHOP CATEGORIES  (ShopDB → ShopCategory)
   Legacy: GetShopCategory, SaveShopCategory, AddShopCategory
===================================================== */

export async function getShopCategories() {
  const pool = await getShopPool();

  const result = await pool.request().query(`
    SELECT idx, CategoryName, CategoryNum, CategoryUse
    FROM ShopCategory
    ORDER BY idx
  `);

  return { ok: true, rows: result.recordset };
}

export async function addShopCategory(body, ctx = {}) {
  const { name, categoryNum, enabled = true } = body;

  if (!name || categoryNum == null) {
    return { ok: false, message: "MISSING_FIELDS" };
  }

  const pool = await getShopPool();

  await pool
    .request()
    .input("CategoryName", sql.NVarChar(100), name)
    .input("CategoryNum", sql.Int, Number(categoryNum))
    .input("CategoryUse", sql.Bit, enabled ? 1 : 0)
    .query(`
      INSERT INTO ShopCategory (CategoryName, CategoryNum, CategoryUse)
      VALUES (@CategoryName, @CategoryNum, @CategoryUse)
    `);

  return { ok: true };
}

export async function updateShopCategory(idx, body, ctx = {}) {
  const setClauses = [];
  const pool = await getShopPool();
  const req = pool.request();

  req.input("idx", sql.Int, Number(idx));

  if (body.name != null) {
    req.input("CategoryName", sql.NVarChar(100), body.name);
    setClauses.push("CategoryName = @CategoryName");
  }
  if (body.categoryNum != null) {
    req.input("CategoryNum", sql.Int, Number(body.categoryNum));
    setClauses.push("CategoryNum = @CategoryNum");
  }
  if (body.enabled != null) {
    req.input("CategoryUse", sql.Bit, body.enabled ? 1 : 0);
    setClauses.push("CategoryUse = @CategoryUse");
  }

  if (setClauses.length === 0) {
    return { ok: false, message: "NO_FIELDS_PROVIDED" };
  }

  await req.query(`
    UPDATE ShopCategory
    SET ${setClauses.join(", ")}
    WHERE idx = @idx
  `);

  return { ok: true };
}

/* =====================================================
   SHOP ITEMS  (ShopDB → ShopItemMap)
   Legacy: GetShopItem, SaveShopItem, AddShopItem, DisableShopItem
===================================================== */

export async function getShopItems() {
  const pool = await getShopPool();

  const result = await pool.request().query(`
    SELECT ProductNum, ItemMain, ItemSub, ItemName,
           ItemCategory, ItemStock, ItemMoney, ShopType
    FROM ShopItemMap
    ORDER BY ProductNum
  `);

  return { ok: true, rows: result.recordset };
}

export async function addShopItem(body, ctx = {}) {
  const { itemMain, itemSub, itemName, category, stock, price, enabled = true } = body;

  if (itemMain == null || itemSub == null || !itemName) {
    return { ok: false, message: "MISSING_FIELDS" };
  }

  const pool = await getShopPool();

  await pool
    .request()
    .input("ItemMain", sql.SmallInt, Number(itemMain))
    .input("ItemSub", sql.SmallInt, Number(itemSub))
    .input("ItemName", sql.NVarChar(100), itemName)
    .input("ItemCategory", sql.Int, Number(category) || 0)
    .input("ItemStock", sql.Int, Number(stock) || 0)
    .input("ItemMoney", sql.Int, Number(price) || 0)
    .input("ShopType", sql.Bit, enabled ? 1 : 0)
    .query(`
      INSERT INTO ShopItemMap (ItemMain, ItemSub, ItemName, ItemCategory, ItemStock, ItemMoney, ShopType)
      VALUES (@ItemMain, @ItemSub, @ItemName, @ItemCategory, @ItemStock, @ItemMoney, @ShopType)
    `);

  return { ok: true };
}

export async function updateShopItem(productNum, body, ctx = {}) {
  const setClauses = [];
  const pool = await getShopPool();
  const req = pool.request();

  req.input("ProductNum", sql.Int, Number(productNum));

  if (body.itemMain != null) {
    req.input("ItemMain", sql.SmallInt, Number(body.itemMain));
    setClauses.push("ItemMain = @ItemMain");
  }
  if (body.itemSub != null) {
    req.input("ItemSub", sql.SmallInt, Number(body.itemSub));
    setClauses.push("ItemSub = @ItemSub");
  }
  if (body.itemName != null) {
    req.input("ItemName", sql.NVarChar(100), body.itemName);
    setClauses.push("ItemName = @ItemName");
  }
  if (body.category != null) {
    req.input("ItemCategory", sql.Int, Number(body.category));
    setClauses.push("ItemCategory = @ItemCategory");
  }
  if (body.stock != null) {
    req.input("ItemStock", sql.Int, Number(body.stock));
    setClauses.push("ItemStock = @ItemStock");
  }
  if (body.price != null) {
    req.input("ItemMoney", sql.Int, Number(body.price));
    setClauses.push("ItemMoney = @ItemMoney");
  }
  if (body.enabled != null) {
    req.input("ShopType", sql.Bit, body.enabled ? 1 : 0);
    setClauses.push("ShopType = @ShopType");
  }

  if (setClauses.length === 0) {
    return { ok: false, message: "NO_FIELDS_PROVIDED" };
  }

  await req.query(`
    UPDATE ShopItemMap
    SET ${setClauses.join(", ")}
    WHERE ProductNum = @ProductNum
  `);

  return { ok: true };
}

export async function disableShopItem(productNum, ctx = {}) {
  const pool = await getShopPool();

  await pool
    .request()
    .input("ProductNum", sql.Int, Number(productNum))
    .query(`
      UPDATE ShopItemMap SET ShopType = 0 WHERE ProductNum = @ProductNum
    `);

  return { ok: true };
}

/* =====================================================
   MYSTERY SHOP ITEMS  (GameDB → MysteryShop)
   Legacy: MysteryShopGetItem, MysteryShopSaveItem,
           MysteryShopAddItem, MysteryShopDisableItem
===================================================== */

export async function getMysteryShopItems() {
  const pool = await getGamePool();

  const result = await pool.request().query(`
    SELECT ProductID, ItemIDMain, ItemIDSub, ItemStock,
           ItemCost, ItemGroup, ItemUse
    FROM MysteryShop
    ORDER BY ProductID
  `);

  return { ok: true, rows: result.recordset };
}

export async function addMysteryShopItem(body, ctx = {}) {
  const { itemMain, itemSub, stock, price, group = 0, enabled = true } = body;

  if (itemMain == null || itemSub == null) {
    return { ok: false, message: "MISSING_FIELDS" };
  }

  const pool = await getGamePool();

  await pool
    .request()
    .input("ItemIDMain", sql.SmallInt, Number(itemMain))
    .input("ItemIDSub", sql.SmallInt, Number(itemSub))
    .input("ItemStock", sql.SmallInt, Number(stock) || 0)
    .input("ItemCost", sql.SmallInt, Number(price) || 0)
    .input("ItemGroup", sql.Int, Number(group))
    .input("ItemUse", sql.Bit, enabled ? 1 : 0)
    .query(`
      INSERT INTO MysteryShop (ItemIDMain, ItemIDSub, ItemStock, ItemCost, ItemGroup, ItemUse)
      VALUES (@ItemIDMain, @ItemIDSub, @ItemStock, @ItemCost, @ItemGroup, @ItemUse)
    `);

  return { ok: true };
}

export async function updateMysteryShopItem(productId, body, ctx = {}) {
  const setClauses = [];
  const pool = await getGamePool();
  const req = pool.request();

  req.input("ProductID", sql.Int, Number(productId));

  if (body.itemMain != null) {
    req.input("ItemIDMain", sql.SmallInt, Number(body.itemMain));
    setClauses.push("ItemIDMain = @ItemIDMain");
  }
  if (body.itemSub != null) {
    req.input("ItemIDSub", sql.SmallInt, Number(body.itemSub));
    setClauses.push("ItemIDSub = @ItemIDSub");
  }
  if (body.stock != null) {
    req.input("ItemStock", sql.SmallInt, Number(body.stock));
    setClauses.push("ItemStock = @ItemStock");
  }
  if (body.price != null) {
    req.input("ItemCost", sql.SmallInt, Number(body.price));
    setClauses.push("ItemCost = @ItemCost");
  }
  if (body.group != null) {
    req.input("ItemGroup", sql.Int, Number(body.group));
    setClauses.push("ItemGroup = @ItemGroup");
  }
  if (body.enabled != null) {
    req.input("ItemUse", sql.Bit, body.enabled ? 1 : 0);
    setClauses.push("ItemUse = @ItemUse");
  }

  if (setClauses.length === 0) {
    return { ok: false, message: "NO_FIELDS_PROVIDED" };
  }

  await req.query(`
    UPDATE MysteryShop
    SET ${setClauses.join(", ")}
    WHERE ProductID = @ProductID
  `);

  return { ok: true };
}

export async function disableMysteryShopItem(productId, ctx = {}) {
  const pool = await getGamePool();

  await pool
    .request()
    .input("ProductID", sql.Int, Number(productId))
    .query(`
      UPDATE MysteryShop SET ItemUse = 0 WHERE ProductID = @ProductID
    `);

  return { ok: true };
}

/* =====================================================
   MYSTERY SHOP USER DATA  (GameDB → blob)
   Legacy: MysteryShopUserLoad, MysteryShopUserSave

   The user's mystery shop state is stored as a binary
   blob via sp_CharMysteryShopLoad / sp_CharMysteryShopSave.
   TODO: implement blob deserializer when ready.
===================================================== */

export async function getMysteryShopUserData(userNum) {
  const pool = await getGamePool();

  // Check if user has mystery shop data, create if not
  const checkResult = await pool
    .request()
    .input("UserNum", sql.Int, Number(userNum))
    .output("nReturn", sql.Int)
    .execute("dbo.sp_CharMysteryShopCheck");

  const exists = checkResult.output.nReturn;

  if (!exists) {
    await pool
      .request()
      .input("UserNum", sql.Int, Number(userNum))
      .output("nReturn", sql.Int)
      .execute("dbo.sp_CharMysteryShopMake");
  }

  // Load the blob
  const result = await pool
    .request()
    .input("UserNum", sql.Int, Number(userNum))
    .execute("dbo.sp_CharMysteryShopLoad");

  if (!result.recordset.length) {
    return { ok: true, data: null };
  }

  const buffer = result.recordset[0].MysteryShop;

  if (!buffer || buffer.length < 4) {
    return { ok: true, data: null };
  }

  // TODO: deserialize the binary blob into structured data
  // For now, return raw buffer info
  return {
    ok: true,
    data: {
      bufferSize: buffer.length,
      raw: buffer.toString("base64"),
    },
  };
}

export async function saveMysteryShopUserData(userNum, blobBase64, ctx = {}) {
  const pool = await getGamePool();

  const buffer = Buffer.from(blobBase64, "base64");

  await pool
    .request()
    .input("UserNum", sql.Int, Number(userNum))
    .input("MysteryShop", sql.VarBinary(sql.MAX), buffer)
    .execute("dbo.sp_CharMysteryShopSave");

  return { ok: true };
}
