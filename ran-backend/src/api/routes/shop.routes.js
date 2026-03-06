/**
 * =====================================================
 * Shop API
 * =====================================================
 * Base Path : /api/shop
 *
 * Description:
 *   Authenticated shop endpoints for browsing categories,
 *   viewing items, retrieving the full shop, and
 *   purchasing shop items.
 *
 * Auth:
 *   - Authenticated user required for all endpoints
 *
 * Feature Flag:
 *   - baseServerConfig.shop.enabled must be true
 *
 * Notes:
 *   - Shop availability is enforced via IsShopEnabled middleware
 *   - User context is taken from session
 * =====================================================
 */
import express from "express";
import {
  getShopCategoriesController,
  getShopItemsController,
  getFullShopController,
  purchaseShopItemController,
  purchaseCartController,
  getPurchaseHistoryController,
} from "../controllers/shop.controller.js";
import {
  requireAuth,
  requireShopEnabled,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Below are the required to be passed to access these APIs
 */
router.use(requireShopEnabled);
router.use(requireAuth);

/**
 * -----------------------------------------------------
 * GET /api/shop/categories
 * -----------------------------------------------------
 * Description:
 *   Retrieve all available shop categories.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Success Response:
 *   - JSON array returned by shop service
 *
 * Error Response:
 *   - 500 Internal Server Error
 *   {
 *     error : "SHOP_CATEGORY_LOAD_FAILED"
 *   }
 */
router.get("/categories", getShopCategoriesController);

/**
 * -----------------------------------------------------
 * GET /api/shop/items
 * -----------------------------------------------------
 * Description:
 *   Retrieve shop items belonging to a specific category.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Query Parameters:
 *   - category : number (required)
 *
 * Success Response:
 *   - JSON array returned by shop service
 *
 * Error Responses:
 *   - 400 Bad Request
 *   {
 *     error : "INVALID_CATEGORY"
 *   }
 *
 *   - 500 Internal Server Error
 *   {
 *     error : "SHOP_ITEM_LOAD_FAILED"
 *   }
 */
router.get("/items", getShopItemsController);

/**
 * -----------------------------------------------------
 * GET /api/shop
 * -----------------------------------------------------
 * Description:
 *   Retrieve the full shop structure including
 *   categories and items.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Success Response:
 *   - JSON object returned by shop service
 *
 * Error Response:
 *   - 500 Internal Server Error
 *   {
 *     error : "SHOP_LOAD_FAILED"
 *   }
 */
router.get("/", getFullShopController);

router.get("/purchase-history", getPurchaseHistoryController);

/**
 * -----------------------------------------------------
 * POST /api/shop/purchase
 * -----------------------------------------------------
 * Description:
 *   Purchase a shop item for the authenticated user.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   - productNum : number (required)
 *
 * Context Used:
 *   - userNum : session userNum
 *   - userUID : session userid
 *
 * Success Response:
 *   {
 *     success : true,
 *     message : "PURCHASE_SUCCESS"
 *   }
 *
 * Error Responses:
 *   - 400 Bad Request
 *   {
 *     error : "INVALID_PRODUCT"
 *   }
 *
 *   - 400 Bad Request
 *   {
 *     error : string
 *   }
 *
 * Notes:
 *   - Service-layer errors are returned directly
 */
router.post("/purchase", purchaseShopItemController);
router.post("/purchase-cart", purchaseCartController);

export default router;
