import { Router } from "express";
import {
  getCategories,
  createCategory,
  patchCategory,
  getItems,
  createItem,
  patchItem,
  deleteItem,
  getMysteryItems,
  createMysteryItem,
  patchMysteryItem,
  deleteMysteryItem,
  getMysteryUserData,
  saveMysteryUserData,
} from "./gmShop.controller.js";

const router = Router();

/* =====================================================
   SHOP CATEGORIES
   DB: ShopDB → ShopCategory
===================================================== */

/**
 * @route   GET /api/gmtool/shop/categories
 * @desc    Get all shop categories
 * @access  GM Tool (auth inherited from parent router)
 *
 * @example Response 200:
 * {
 *   "ok": true,
 *   "rows": [
 *     { "idx": 1, "CategoryName": "Weapons", "CategoryNum": 100, "CategoryUse": true },
 *     { "idx": 2, "CategoryName": "Armor", "CategoryNum": 200, "CategoryUse": true }
 *   ]
 * }
 */
router.get("/categories", getCategories);

/**
 * @route   POST /api/gmtool/shop/categories
 * @desc    Add a new shop category
 * @access  GM Tool
 *
 * @example Request body:
 * { "name": "Consumables", "categoryNum": 300, "enabled": true }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.post("/categories", createCategory);

/**
 * @route   PATCH /api/gmtool/shop/categories/:idx
 * @desc    Update an existing shop category (partial update)
 * @access  GM Tool
 *
 * @example Request body:
 * { "name": "Potions", "enabled": false }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.patch("/categories/:idx", patchCategory);

/* =====================================================
   SHOP ITEMS
   DB: ShopDB → ShopItemMap
===================================================== */

/**
 * @route   GET /api/gmtool/shop/items
 * @desc    Get all shop items
 * @access  GM Tool
 *
 * @example Response 200:
 * {
 *   "ok": true,
 *   "rows": [
 *     {
 *       "ProductNum": 1, "ItemMain": 100, "ItemSub": 5,
 *       "ItemName": "Healing Potion", "ItemCategory": 300,
 *       "ItemStock": 999, "ItemMoney": 500, "ShopType": true
 *     }
 *   ]
 * }
 */
router.get("/items", getItems);

/**
 * @route   POST /api/gmtool/shop/items
 * @desc    Add a new shop item
 * @access  GM Tool
 *
 * @example Request body:
 * {
 *   "itemMain": 100, "itemSub": 5, "itemName": "Healing Potion",
 *   "category": 300, "stock": 999, "price": 500, "enabled": true
 * }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.post("/items", createItem);

/**
 * @route   PATCH /api/gmtool/shop/items/:productNum
 * @desc    Update a shop item (partial update)
 * @access  GM Tool
 *
 * @example Request body:
 * { "price": 750, "stock": 500 }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.patch("/items/:productNum", patchItem);

/**
 * @route   DELETE /api/gmtool/shop/items/:productNum
 * @desc    Disable a shop item (sets ShopType = 0)
 * @access  GM Tool
 *
 * @example Response 200:
 * { "ok": true }
 */
router.delete("/items/:productNum", deleteItem);

/* =====================================================
   MYSTERY SHOP ITEMS
   DB: GameDB → MysteryShop
===================================================== */

/**
 * @route   GET /api/gmtool/shop/mystery/items
 * @desc    Get all mystery shop items
 * @access  GM Tool
 *
 * @example Response 200:
 * {
 *   "ok": true,
 *   "rows": [
 *     {
 *       "ProductID": 1, "ItemIDMain": 50, "ItemIDSub": 2,
 *       "ItemStock": 10, "ItemCost": 100, "ItemGroup": 0, "ItemUse": true
 *     }
 *   ]
 * }
 */
router.get("/mystery/items", getMysteryItems);

/**
 * @route   POST /api/gmtool/shop/mystery/items
 * @desc    Add a new mystery shop item
 * @access  GM Tool
 *
 * @example Request body:
 * { "itemMain": 50, "itemSub": 2, "stock": 10, "price": 100, "group": 0, "enabled": true }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.post("/mystery/items", createMysteryItem);

/**
 * @route   PATCH /api/gmtool/shop/mystery/items/:productId
 * @desc    Update a mystery shop item (partial update)
 * @access  GM Tool
 *
 * @example Request body:
 * { "price": 150, "stock": 5 }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.patch("/mystery/items/:productId", patchMysteryItem);

/**
 * @route   DELETE /api/gmtool/shop/mystery/items/:productId
 * @desc    Disable a mystery shop item (sets ItemUse = 0)
 * @access  GM Tool
 *
 * @example Response 200:
 * { "ok": true }
 */
router.delete("/mystery/items/:productId", deleteMysteryItem);

/* =====================================================
   MYSTERY SHOP USER DATA (blob)
   DB: GameDB → sp_CharMysteryShopLoad / Save
===================================================== */

/**
 * @route   GET /api/gmtool/shop/mystery/user/:userNum
 * @desc    Load a user's mystery shop data (binary blob)
 * @access  GM Tool
 *
 * @example Response 200:
 * {
 *   "ok": true,
 *   "data": { "bufferSize": 256, "raw": "<base64-encoded blob>" }
 * }
 */
router.get("/mystery/user/:userNum", getMysteryUserData);

/**
 * @route   POST /api/gmtool/shop/mystery/user/:userNum
 * @desc    Save a user's mystery shop data (binary blob)
 * @access  GM Tool
 *
 * @example Request body:
 * { "blob": "<base64-encoded blob>" }
 *
 * @example Response 200:
 * { "ok": true }
 */
router.post("/mystery/user/:userNum", saveMysteryUserData);

export default router;
