import sql from "mssql";
import { getShopPool } from "../../loaders/mssql.js";

/**
 * =====================================================
 * Admin Panel - Shop Analytics Service
 * =====================================================
 */

/**
 * Overview KPIs: total purchases, today's purchases, active items, out-of-stock
 */
export async function getShopOverview() {
  const pool = await getShopPool();

  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.ShopPurchaseLog) AS totalPurchases,
      (SELECT COUNT(*) FROM dbo.ShopPurchaseLog WHERE Date >= CAST(GETUTCDATE() AS DATE)) AS purchasesToday,
      (SELECT COUNT(*) FROM dbo.ShopItemMap WHERE ItemMoney > 0) AS activeItems,
      (SELECT COUNT(*) FROM dbo.ShopItemMap WHERE ItemMoney > 0 AND ItemStock = 0) AS outOfStock
  `);

  const row = result.recordset[0];
  return {
    totalPurchases: row.totalPurchases,
    purchasesToday: row.purchasesToday,
    activeItems: row.activeItems,
    outOfStock: row.outOfStock,
  };
}

/**
 * Top purchased items, optionally filtered by last N days
 */
export async function getTopItems(days) {
  const pool = await getShopPool();
  const req = pool.request();

  let dateFilter = "";
  if (days) {
    req.input("Days", sql.Int, days);
    dateFilter = "WHERE l.Date >= DATEADD(day, -@Days, GETUTCDATE())";
  }

  const result = await req.query(`
    SELECT TOP 10
      l.ProductNum,
      m.ItemMain,
      m.ItemSub,
      COUNT(*) AS purchaseCount,
      SUM(l.ItemMoney) AS totalRevenue
    FROM dbo.ShopPurchaseLog l
    LEFT JOIN dbo.ShopItemMap m ON l.ProductNum = m.ProductNum
    ${dateFilter}
    GROUP BY l.ProductNum, m.ItemMain, m.ItemSub
    ORDER BY purchaseCount DESC
  `);

  return result.recordset;
}

/**
 * Revenue summary grouped by currency type (ShopType 1 = ePoints, 2 = vPoints)
 */
export async function getRevenueSummary() {
  const pool = await getShopPool();

  const result = await pool.request().query(`
    SELECT
      ISNULL(m.ShopType, 0) AS shopType,
      COUNT(*) AS totalPurchases,
      SUM(l.ItemMoney) AS totalRevenue
    FROM dbo.ShopPurchaseLog l
    LEFT JOIN dbo.ShopItemMap m ON l.ProductNum = m.ProductNum
    GROUP BY m.ShopType
  `);

  return result.recordset.map((r) => ({
    shopType: r.shopType,
    totalPurchases: r.totalPurchases,
    totalRevenue: r.totalRevenue,
  }));
}

/**
 * Daily sales trend for the last N days (default 30)
 */
export async function getDailySalesTrend(days = 30) {
  const pool = await getShopPool();
  const req = pool.request();
  req.input("Days", sql.Int, days);

  const result = await req.query(`
    SELECT
      CAST(l.Date AS DATE) AS saleDate,
      COUNT(*) AS purchaseCount,
      SUM(l.ItemMoney) AS revenue
    FROM dbo.ShopPurchaseLog l
    WHERE l.Date >= DATEADD(day, -@Days, GETUTCDATE())
    GROUP BY CAST(l.Date AS DATE)
    ORDER BY saleDate
  `);

  return result.recordset.map((r) => ({
    date: r.saleDate,
    purchaseCount: r.purchaseCount,
    revenue: r.revenue,
  }));
}

/**
 * Recent purchases feed (latest N)
 */
export async function getRecentPurchases(limit = 20) {
  const pool = await getShopPool();
  const req = pool.request();
  req.input("Limit", sql.Int, limit);

  const result = await req.query(`
    SELECT TOP (@Limit)
      l.idx,
      l.ProductNum,
      l.ItemMain,
      l.ItemSub,
      l.ItemMoney,
      l.Date,
      l.UserID,
      ISNULL(m.ShopType, 0) AS ShopType
    FROM dbo.ShopPurchaseLog l
    LEFT JOIN dbo.ShopItemMap m ON l.ProductNum = m.ProductNum
    ORDER BY l.idx DESC
  `);

  return result.recordset;
}
