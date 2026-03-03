import { baseServerConfig } from "../config/server.config.js";
import { getShopPool } from "../loaders/mssql.js";
import { purchaseShopItemTx } from "../repositories/shopPurchase.repo.js";
import {
  getCachedCategories,
  getCachedItems,
  setCachedCategories,
  setCachedItems,
} from "./cache/shop.cache.js";
import { getItemById } from "./items.service.js";
import sql from "mssql";

/* =====================================================
   Category Loading
===================================================== */

export const getShopCategories = async () => {
  const cached = getCachedCategories();
  if (cached) return cached;

  const pool = await getShopPool();

  const result = await pool.request().query(`
    SELECT
      CategoryNum,
      CategoryName
    FROM RG2Shop.dbo.ShopCategory
    WHERE CategoryUse = 1
    ORDER BY CategoryNum ASC
  `);

  const categories = result.recordset.map((row) => ({
    categoryNum: row.CategoryNum,
    name: row.CategoryName,
  }));

  setCachedCategories(categories);
  return categories;
};

/* =====================================================
   Item Metadata (Cached)
===================================================== */

const loadItemMetadata = async () => {
  const cached = getCachedItems();
  if (cached) return cached;

  const pool = await getShopPool();

  const result = await pool.request().query(`
    SELECT
      ProductNum,
      ItemMain,
      ItemSub,
      ItemName,
      ItemMoney,
      ShopType,
      ItemCategory
    FROM RG2Shop.dbo.ShopItemMap
  `);

  const itemsByCategory = {};

  for (const row of result.recordset) {
    // Feature flag filtering
    if (row.ShopType === 1 && !baseServerConfig.shop.premiumShop) continue;
    if (row.ShopType === 2 && !baseServerConfig.shop.voteShop) continue;

    const itemId = `${row.ItemMain}-${row.ItemSub}`;
    const itemMeta = getItemById(itemId);

    if (!itemMeta) {
      // Optional: log once if you want visibility
      // console.warn(`[SHOP] Item not found in item pool: ${itemId}`);
      continue;
    }

    if (!itemsByCategory[row.ItemCategory]) {
      itemsByCategory[row.ItemCategory] = [];
    }

    const isBox = itemMeta.type.id === 12 || itemMeta.type.id === 91;

    itemsByCategory[row.ItemCategory].push({
      productNum: row.ProductNum,
      //name: row.ItemName,
      name: itemMeta.name,
      itemMainID: row.ItemMain,
      itemSubID: row.ItemSub,
      price: row.ItemMoney,
      currency:
        row.ShopType === 1
          ? "UserPoint"
          : row.ShopType === 2
            ? "UserPoint2"
            : "UNKNOWN",
      iconName: itemMeta.inventoryFile,
      iconMain: itemMeta.sIconMainID,
      iconSub: itemMeta.sIconSubID,
      isBox,
      ...(isBox &&
        itemMeta.box?.showContents && {
          boxContent: itemMeta.box.items.map((boxItem) => {
            const boxItemMeta = getItemById(boxItem.itemId);

            return {
              itemId: boxItem.itemId,
              name: boxItemMeta ? boxItemMeta.name : "UNKNOWN",
              atkgrade: boxItemMeta.grade.attack,
              defgrade: boxItemMeta.grade.defense,
              amount: boxItem.amount,
            };
          }),
        }),
    });
  }

  setCachedItems(itemsByCategory);
  return itemsByCategory;
};

/* =====================================================
   Live Stock (Non-Cached)
===================================================== */

const loadLiveStockByCategory = async (categoryNum) => {
  const pool = await getShopPool();

  const result = await pool.request().input("Category", categoryNum).query(`
      SELECT
        ProductNum,
        ItemStock
      FROM RG2Shop.dbo.ShopItemMap
      WHERE ItemCategory = @Category
    `);

  const stockMap = {};
  for (const row of result.recordset) {
    stockMap[row.ProductNum] = row.ItemStock;
  }

  return stockMap;
};

/* =====================================================
   Public Shop APIs
===================================================== */

export const getShopItemsByCategory = async (categoryNum) => {
  const metadata = await loadItemMetadata();
  const stockMap = await loadLiveStockByCategory(categoryNum);

  const items = metadata[categoryNum] || [];

  return items.map((item) => ({
    ...item,
    stock: stockMap[item.productNum] ?? 0,
  }));
};

export const getFullShop = async () => {
  const categories = await getShopCategories();
  const metadata = await loadItemMetadata();

  const pool = await getShopPool();
  const stockResult = await pool.request().query(`
    SELECT
      ProductNum,
      ItemStock
    FROM RG2Shop.dbo.ShopItemMap
  `);

  const stockMap = {};
  for (const row of stockResult.recordset) {
    stockMap[row.ProductNum] = row.ItemStock;
  }

  const items = {};

  for (const category of categories) {
    items[category.categoryNum] = (metadata[category.categoryNum] || []).map(
      (item) => ({
        ...item,
        stock: stockMap[item.productNum] ?? 0,
      }),
    );
  }

  return {
    categories,
    items,
  };
};

/* =====================================================
   Purchase
===================================================== */

export const purchaseShopItem = async (payload) => {
  return purchaseShopItemTx(payload);
};

// History
export const getPurchaseHistoryService = async ({
  userId,
  page = 1,
  pageSize = 25,
  startDate,
  endDate,
}) => {
  const pool = await getShopPool();
  const offset = (page - 1) * pageSize;

  const request = pool.request();
  request.input("UserID", sql.VarChar(50), userId);
  request.input("Offset", sql.Int, offset);
  request.input("PageSize", sql.Int, pageSize);

  let dateFilter = "";

  if (startDate) {
    request.input("StartDate", sql.DateTime, new Date(startDate));
    dateFilter += " AND Date >= @StartDate";
  }

  if (endDate) {
    request.input("EndDate", sql.DateTime, new Date(endDate));
    dateFilter += " AND Date <= @EndDate";
  }

  const result = await request.query(`
    SELECT
      idx,
      ProductNum,
      ItemMain,
      ItemSub,
      ItemMoney,
      Date,
      UserID,
      IsGift,
      ReceiverUserID,
      COUNT(*) OVER() AS TotalCount
    FROM RG2Shop.dbo.ShopPurchaseLog
    WHERE UserID = @UserID
    ${dateFilter}
    ORDER BY idx DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY
  `);

  const items = result.recordset;
  const total = items.length > 0 ? items[0].TotalCount : 0;

  const enrichedItems = items.map(({ TotalCount, ...row }) => {
    const itemId = `${row.ItemMain}-${row.ItemSub}`;
    const itemMeta = getItemById(itemId);

    return {
      ...row,
      itemName: itemMeta ? itemMeta.name : "Unknown Item",
    };
  });

  return {
    items: enrichedItems,
    total,
    page,
    pageSize,
  };
};
