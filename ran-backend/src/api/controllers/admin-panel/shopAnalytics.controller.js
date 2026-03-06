import * as analyticsService from "../../../services/admin-panel/shopAnalytics.service.js";
import { getItemById } from "../../../services/items.service.js";

export const getOverviewController = async (_req, res) => {
  try {
    const data = await analyticsService.getShopOverview();
    return res.json({ ok: true, data });
  } catch {
    return res.status(500).json({ ok: false, message: "Failed to load shop overview" });
  }
};

export const getTopItemsController = async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : null;
    const raw = await analyticsService.getTopItems(days);

    const items = raw.map((r) => {
      const itemId = `${r.ItemMain}-${r.ItemSub}`;
      const meta = getItemById(itemId);
      return {
        productNum: r.ProductNum,
        itemMain: r.ItemMain,
        itemSub: r.ItemSub,
        itemName: meta ? meta.name : `Item ${itemId}`,
        purchaseCount: r.purchaseCount,
        totalRevenue: r.totalRevenue,
      };
    });

    return res.json({ ok: true, data: items });
  } catch {
    return res.status(500).json({ ok: false, message: "Failed to load top items" });
  }
};

export const getRevenueController = async (_req, res) => {
  try {
    const data = await analyticsService.getRevenueSummary();
    return res.json({ ok: true, data });
  } catch {
    return res.status(500).json({ ok: false, message: "Failed to load revenue" });
  }
};

export const getDailyTrendController = async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const data = await analyticsService.getDailySalesTrend(days);
    return res.json({ ok: true, data });
  } catch {
    return res.status(500).json({ ok: false, message: "Failed to load sales trend" });
  }
};

export const getRecentPurchasesController = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const raw = await analyticsService.getRecentPurchases(limit);

    const items = raw.map((r) => {
      const itemId = `${r.ItemMain}-${r.ItemSub}`;
      const meta = getItemById(itemId);
      return {
        idx: r.idx,
        productNum: r.ProductNum,
        itemMain: r.ItemMain,
        itemSub: r.ItemSub,
        itemName: meta ? meta.name : `Item ${itemId}`,
        price: r.ItemMoney,
        date: r.Date,
        userId: r.UserID,
        shopType: r.ShopType,
      };
    });

    return res.json({ ok: true, data: items });
  } catch {
    return res.status(500).json({ ok: false, message: "Failed to load recent purchases" });
  }
};
