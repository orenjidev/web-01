/**
 * =====================================================
 * Admin API
 * =====================================================
 * Base Path : /api/admin
 * Auth      : Staff authentication required for all routes
 *             Admin authorization enforced per operation
 *
 * Description:
 *   Administrative endpoints for managing downloads,
 *   news content, and shop configuration.
 *
 * Notes:
 *   - router.use(requireStaff) applies staff authentication globally
 *   - Some operations additionally require admin privileges
 * =====================================================
 */

import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { requireStaff } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireStaff);

/**
 * -----------------------------------------------------
 * POST /api/admin/download
 * -----------------------------------------------------
 * Description:
 *   Create a new downloadable resource entry.
 *
 * Authorization:
 *   - Staff authentication required
 *   - Admin role required (validated in service layer)
 *
 * Request Body:
 *   - title               : string (required)
 *   - downloadLink        : string (required)
 *   - descriptionBase64   : string (optional)
 *   - downloadType        : string (optional, default "other")
 *   - visible             : number | boolean (optional, default 1)
 *
 * Context Used:
 *   - userId   : session userNum
 *   - userType : session type
 *   - ip       : request IP
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     id      : number,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 403 Forbidden
 *   {
 *     ok      : false,
 *     message : string
 *   }
 */
router.post("/download", adminController.insertDownloadController);

/**
 * -----------------------------------------------------
 * POST /api/admin/edit-download
 * -----------------------------------------------------
 * Description:
 *   Update an existing downloadable resource entry.
 *
 * Authorization:
 *   - Staff authentication required
 *   - Admin role required
 *
 * Request Body:
 *   - id                  : number (required)
 *   - title               : string (optional)
 *   - descriptionBase64   : string (optional)
 *   - downloadLink        : string (optional)
 *   - downloadType        : string (optional)
 *   - visible             : number | boolean (optional)
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 403 Forbidden
 *   - Download not found
 *   - Invalid request body
 */
router.post("/edit-download", adminController.updateDownloadController);

/**
 * -----------------------------------------------------
 * POST /api/admin/news
 * -----------------------------------------------------
 * Description:
 *   Create a new news entry.
 *
 * Authorization:
 *   - Staff authentication required
 *   - No admin role check enforced in service
 *
 * Request Body:
 *   - type                 : string (required)
 *   - title                : string (required)
 *   - longDescriptionBase64: string (required)
 *   - author               : string (optional)
 *   - bannerImg            : string (optional)
 *   - bannerImg2           : string (optional)
 *   - shortDescription     : string (optional)
 *   - isPinned             : number | boolean (optional, default 0)
 *   - pinPriority          : number (optional, default 0)
 *   - visible              : number | boolean (optional, default 1)
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     id      : number,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 403 Forbidden
 *   - Invalid request body
 */
router.post("/news", requireStaff, adminController.insertNewsController);

/**
 * -----------------------------------------------------
 * POST /api/admin/edit-news
 * -----------------------------------------------------
 * Description:
 *   Update an existing news entry.
 *
 * Authorization:
 *   - Staff authentication required
 *   - Admin role required
 *
 * Request Body:
 *   - id                   : number (required)
 *   - type                 : string (optional)
 *   - title                : string (optional)
 *   - author               : string (optional)
 *   - bannerImg            : string (optional)
 *   - bannerImg2           : string (optional)
 *   - shortDescription     : string (optional)
 *   - longDescriptionBase64: string (optional)
 *   - isPinned             : number | boolean (optional)
 *   - pinPriority          : number (optional)
 *   - visible              : number | boolean (optional)
 *
 * Success Response:
 *   {
 *     ok      : true,
 *     message : string
 *   }
 *
 * Error Response:
 *   - 403 Forbidden
 *   - News entry not found
 *   - Invalid request body
 */
router.post("/edit-news", adminController.updateNewsController);

/**
 * -----------------------------------------------------
 * POST /api/admin/shop/category
 * -----------------------------------------------------
 * Description:
 *   Create a new shop category.
 *
 * Authorization:
 *   - Staff authentication required
 *
 * Request Body:
 *   - categoryNum : number (required)
 *   - name        : string (required)
 *
 * Success Response:
 *   {
 *     success : true
 *   }
 *
 * Error Response:
 *   - 400 Bad Request
 *   - INVALID_INPUT
 */
router.post("/shop/category", adminController.createShopCategoryController);

/**
 * -----------------------------------------------------
 * PUT /api/admin/shop/category/:categoryNum
 * -----------------------------------------------------
 * Description:
 *   Update an existing shop category.
 *
 * Authorization:
 *   - Staff authentication required
 *
 * Route Params:
 *   - categoryNum : number (required)
 *
 * Request Body:
 *   - name    : string (optional)
 *   - enabled : boolean | number (optional)
 *
 * Success Response:
 *   {
 *     success : true
 *   }
 *
 * Error Response:
 *   - 400 Bad Request
 */
router.put(
  "/shop/category/:categoryNum",
  adminController.updateShopCategoryController,
);

/**
 * -----------------------------------------------------
 * POST /api/admin/shop/item
 * -----------------------------------------------------
 * Description:
 *   Create a new shop item mapping.
 *
 * Authorization:
 *   - Staff authentication required
 *
 * Request Body:
 *   - itemMain     : number (required)
 *   - itemSub      : number (required)
 *   - itemName     : string (required)
 *   - itemCategory : number (required)
 *   - itemMoney    : number (required)
 *   - shopType     : string | number (required)
 *   - itemStock    : number (optional, default 0)
 *
 * Success Response:
 *   {
 *     success    : true,
 *     productNum : number
 *   }
 *
 * Error Response:
 *   - 400 Bad Request
 *   - INVALID_INPUT
 */
router.post("/shop/item", adminController.createShopItemMapController);

/**
 * -----------------------------------------------------
 * PUT /api/admin/shop/item/:productNum
 * -----------------------------------------------------
 * Description:
 *   Update an existing shop item mapping.
 *
 * Authorization:
 *   - Staff authentication required
 *
 * Route Params:
 *   - productNum : number (required)
 *
 * Request Body:
 *   - itemMain     : number (optional)
 *   - itemSub      : number (optional)
 *   - itemName     : string (optional)
 *   - itemCategory : number (optional)
 *   - itemStock    : number (optional)
 *   - itemMoney    : number (optional)
 *   - shopType     : string | number (optional)
 *
 * Success Response:
 *   {
 *     success : true
 *   }
 *
 * Error Response:
 *   - 400 Bad Request
 *   - INVALID_PRODUCTNUM
 *   - ITEM_NOT_FOUND
 */
router.put(
  "/shop/item/:productNum",
  adminController.updateShopItemMapController,
);

export default router;
