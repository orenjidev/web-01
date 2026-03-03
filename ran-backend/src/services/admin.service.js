import sql from "mssql";
import { getShopPool, getUserPool, getWebPool } from "../loaders/mssql.js";
import { logAction } from "./actionlog.service.js";
import { getMessage } from "../constants/messages.js";
import { clearShopCache } from "./cache/shop.cache.js";

/* -------------------------
   Downloads
-------------------------- */

export const insertDownload = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const requiredKeys = ["title", "downloadLink"];
  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
    }
  }

  const {
    title,
    descriptionBase64,
    downloadLink,
    downloadType = "other",
    visible = 1,
  } = body;

  if (!title || !downloadLink) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const pool = await getWebPool();

  const result = await pool
    .request()
    .input("Title", sql.NVarChar(255), title)
    .input(
      "DescriptionBase64",
      sql.NVarChar(sql.MAX),
      descriptionBase64 ?? null,
    )
    .input("DownloadLink", sql.NVarChar(2048), downloadLink)
    .input("DownloadType", sql.NVarChar(50), downloadType)
    .input("Visible", sql.Bit, visible ? 1 : 0).query(`
      INSERT INTO DownloadLinks (
        Title,
        DescriptionBase64,
        DownloadLink,
        DownloadType,
        Visible
      )
      VALUES (
        @Title,
        @DescriptionBase64,
        @DownloadLink,
        @DownloadType,
        @Visible
      );

      SELECT SCOPE_IDENTITY() AS ID;
    `);

  const id = result.recordset[0].ID;

  await logAction({
    userId: ctx.userId ?? null,
    actionType: "CREATE",
    entityType: "DOWNLOAD",
    entityId: id,
    description: MSG.LOG.ACTION_DOWNLOAD_CREATE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    ok: true,
    id,
    message: MSG.ADMIN_DOWNLOAD.CREATE_SUCCESS,
  };
};

export const updateDownload = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const requiredKeys = ["id"];
  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
    }
  }

  const { id, title, descriptionBase64, downloadLink, downloadType, visible } =
    body;

  if (!id) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const pool = await getWebPool();

  const exists = await pool.request().input("ID", sql.Int, id).query(`
    SELECT ID FROM dbo.DownloadLinks WHERE ID = @ID
  `);

  if (exists.recordset.length === 0) {
    return { ok: false, message: MSG.ADMIN_DOWNLOAD.NOT_FOUND };
  }

  await pool
    .request()
    .input("ID", sql.Int, id)
    .input("Title", sql.NVarChar(255), title ?? null)
    .input(
      "DescriptionBase64",
      sql.NVarChar(sql.MAX),
      descriptionBase64 ?? null,
    )
    .input("DownloadLink", sql.NVarChar(2048), downloadLink ?? null)
    .input("DownloadType", sql.NVarChar(50), downloadType ?? null)
    .input("Visible", sql.Bit, visible ? 1 : 0).query(`
      UPDATE dbo.DownloadLinks
      SET
        Title = COALESCE(@Title, Title),
        DescriptionBase64 = COALESCE(@DescriptionBase64, DescriptionBase64),
        DownloadLink = COALESCE(@DownloadLink, DownloadLink),
        DownloadType = COALESCE(@DownloadType, DownloadType),
        Visible = COALESCE(@Visible, Visible)
      WHERE ID = @ID
    `);

  await logAction({
    userId: ctx.userId ?? null,
    actionType: "UPDATE",
    entityType: "DOWNLOAD",
    entityId: id,
    description: MSG.LOG.ACTION_DOWNLOAD_UPDATE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.ADMIN_DOWNLOAD.UPDATE_SUCCESS };
};

/* -------------------------
   News
-------------------------- */

export const insertNews = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const requiredKeys = ["type", "title", "longDescriptionBase64"];
  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
    }
  }

  const {
    type,
    title,
    author,
    bannerImg,
    bannerImg2,
    shortDescription,
    longDescriptionBase64,
    isPinned = 0,
    pinPriority = 0,
    visible = 1,
  } = body;

  if (!type || !title || !longDescriptionBase64) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const pool = await getWebPool();

  const result = await pool
    .request()
    .input("Type", sql.NVarChar(50), type)
    .input("Title", sql.NVarChar(255), title)
    .input("Author", sql.NVarChar(150), author ?? null)
    .input("BannerImg", sql.NVarChar(512), bannerImg ?? null)
    .input("BannerImg2", sql.NVarChar(512), bannerImg2 ?? null)
    .input("ShortDescription", sql.NVarChar(500), shortDescription ?? null)
    .input(
      "LongDescriptionBase64",
      sql.NVarChar(sql.MAX),
      longDescriptionBase64,
    )
    .input("IsPinned", sql.Bit, isPinned ? 1 : 0)
    .input("PinPriority", sql.Int, pinPriority)
    .input("Visible", sql.Bit, visible ? 1 : 0).query(`
      INSERT INTO News (
        Type,
        Title,
        Author,
        BannerImg,
        BannerImg2,
        ShortDescription,
        LongDescriptionBase64,
        IsPinned,
        PinPriority,
        Visible
      )
      VALUES (
        @Type,
        @Title,
        @Author,
        @BannerImg,
        @BannerImg2,
        @ShortDescription,
        @LongDescriptionBase64,
        @IsPinned,
        @PinPriority,
        @Visible
      );

      SELECT SCOPE_IDENTITY() AS ID;
    `);

  const id = result.recordset[0].ID;

  await logAction({
    userId: ctx.userId ?? null,
    actionType: "CREATE",
    entityType: "NEWS",
    entityId: id,
    description: MSG.LOG.ACTION_NEWS_CREATE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, id, message: MSG.ADMIN_NEWS.CREATE_SUCCESS };
};

export const updateNews = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const requiredKeys = ["id"];
  for (const key of requiredKeys) {
    if (!(key in body)) {
      return { ok: false, message: MSG.COMMON.BUFFER_SIZE };
    }
  }

  const {
    id,
    type,
    title,
    author,
    bannerImg,
    bannerImg2,
    shortDescription,
    longDescriptionBase64,
    isPinned,
    pinPriority,
    visible,
  } = body;

  if (!id) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const pool = await getWebPool();

  const exists = await pool.request().input("ID", sql.Int, id).query(`
    SELECT ID FROM dbo.News WHERE ID = @ID
  `);

  if (exists.recordset.length === 0) {
    return { ok: false, message: MSG.ADMIN_NEWS.NOT_FOUND };
  }

  await pool
    .request()
    .input("ID", sql.Int, id)
    .input("Type", sql.NVarChar(50), type ?? null)
    .input("Title", sql.NVarChar(255), title ?? null)
    .input("Author", sql.NVarChar(150), author ?? null)
    .input("BannerImg", sql.NVarChar(512), bannerImg ?? null)
    .input("BannerImg2", sql.NVarChar(512), bannerImg2 ?? null)
    .input("ShortDescription", sql.NVarChar(500), shortDescription ?? null)
    .input(
      "LongDescriptionBase64",
      sql.NVarChar(sql.MAX),
      longDescriptionBase64 ?? null,
    )
    .input("IsPinned", sql.Bit, typeof isPinned === "number" ? isPinned : null)
    .input(
      "PinPriority",
      sql.Int,
      typeof pinPriority === "number" ? pinPriority : null,
    )
    .input("Visible", sql.Bit, typeof visible === "number" ? visible : null)
    .query(`
      UPDATE dbo.News
      SET
        Type = COALESCE(@Type, Type),
        Title = COALESCE(@Title, Title),
        Author = COALESCE(@Author, Author),
        BannerImg = COALESCE(@BannerImg, BannerImg),
        BannerImg2 = COALESCE(@BannerImg2, BannerImg2),
        ShortDescription = COALESCE(@ShortDescription, ShortDescription),
        LongDescriptionBase64 = COALESCE(@LongDescriptionBase64, LongDescriptionBase64),
        IsPinned = COALESCE(@IsPinned, IsPinned),
        PinPriority = COALESCE(@PinPriority, PinPriority),
        Visible = COALESCE(@Visible, Visible)
      WHERE ID = @ID
    `);

  await logAction({
    userId: ctx.userId ?? null,
    actionType: "UPDATE",
    entityType: "NEWS",
    entityId: id,
    description: MSG.LOG.ACTION_NEWS_UPDATE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.ADMIN_NEWS.UPDATE_SUCCESS };
};

/* -------------------------
   Shop (internal helpers)
-------------------------- */

export const createShopCategory = async ({ categoryNum, name }) => {
  if (!categoryNum || !name) throw new Error("INVALID_INPUT");

  const pool = await getShopPool();

  await pool
    .request()
    .input("CategoryNum", categoryNum)
    .input("Name", name.trim()).query(`
      INSERT INTO dbo.ShopCategory
        (CategoryNum, CategoryName, CategoryUse)
      VALUES
        (@CategoryNum, @Name, 1)
    `);

  clearShopCache();
};

export const updateShopCategory = async ({ categoryNum, name, enabled }) => {
  const pool = await getShopPool();

  await pool
    .request()
    .input("CategoryNum", categoryNum)
    .input("Name", name)
    .input("Use", enabled ? 1 : 0).query(`
      UPDATE dbo.ShopCategory
      SET
        CategoryName = ISNULL(@Name, CategoryName),
        CategoryUse  = ISNULL(@Use, CategoryUse)
      WHERE CategoryNum = @CategoryNum
    `);

  clearShopCache();
};

export const createShopItemMap = async ({
  itemMain,
  itemSub,
  itemName,
  itemCategory,
  itemStock,
  itemMoney,
  shopType,
}) => {
  if (
    !itemMain ||
    !itemSub ||
    !itemName ||
    !itemCategory ||
    itemMoney == null ||
    !shopType
  ) {
    throw new Error("INVALID_INPUT");
  }

  const pool = await getShopPool();

  const result = await pool
    .request()
    .input("ItemMain", itemMain)
    .input("ItemSub", itemSub)
    .input("ItemName", itemName.trim())
    .input("ItemCategory", itemCategory)
    .input("ItemStock", itemStock ?? 0)
    .input("ItemMoney", itemMoney)
    .input("ShopType", shopType).query(`
      INSERT INTO dbo.ShopItemMap
      (
        ItemMain,
        ItemSub,
        ItemName,
        ItemCategory,
        ItemStock,
        ItemMoney,
        ShopType
      )
      OUTPUT INSERTED.ProductNum
      VALUES
      (
        @ItemMain,
        @ItemSub,
        @ItemName,
        @ItemCategory,
        @ItemStock,
        @ItemMoney,
        @ShopType
      )
    `);

  clearShopCache();

  return { productNum: result.recordset[0].ProductNum };
};

export const updateShopItemMap = async ({
  productNum,
  itemMain,
  itemSub,
  itemName,
  itemCategory,
  itemStock,
  itemMoney,
  shopType,
}) => {
  if (!productNum) throw new Error("INVALID_PRODUCTNUM");

  const pool = await getShopPool();

  const result = await pool
    .request()
    .input("ProductNum", productNum)
    .input("ItemMain", itemMain)
    .input("ItemSub", itemSub)
    .input("ItemName", itemName)
    .input("ItemCategory", itemCategory)
    .input("ItemStock", itemStock)
    .input("ItemMoney", itemMoney)
    .input("ShopType", shopType).query(`
      UPDATE dbo.ShopItemMap
      SET
        ItemMain     = ISNULL(@ItemMain, ItemMain),
        ItemSub      = ISNULL(@ItemSub, ItemSub),
        ItemName     = ISNULL(@ItemName, ItemName),
        ItemCategory = ISNULL(@ItemCategory, ItemCategory),
        ItemStock    = ISNULL(@ItemStock, ItemStock),
        ItemMoney    = ISNULL(@ItemMoney, ItemMoney),
        ShopType     = ISNULL(@ShopType, ShopType)
      WHERE ProductNum = @ProductNum
    `);

  if (result.rowsAffected[0] === 0) throw new Error("ITEM_NOT_FOUND");

  clearShopCache();
};

/* -------------------------
   Topup
-------------------------- */

export async function listTopups({ used }) {
  const pool = await getUserPool();

  const result = await pool.request().input("used", used).query(`
    SELECT
      idx,
      ECode,
      EPin,
      EValue,
      GenDate,
      Used,
      UseDate,
      resellerLoad
    FROM TopUp
    WHERE (@used IS NULL OR Used = @used)
    ORDER BY GenDate DESC
  `);

  return result.recordset;
}

export async function generateTopups(count, value) {
  const pool = await getUserPool();

  const result = await pool
    .request()
    .input("nCount", count)
    .input("nValue", value)
    .output("nReturn")
    .execute("TopUpGenerate");

  return { generated: result.output.nReturn };
}
