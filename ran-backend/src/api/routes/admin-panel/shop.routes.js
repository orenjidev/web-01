/**
 * =====================================================
 * Admin Panel - Shop API
 * =====================================================
 * Base Path : /api/adminpanel/shop
 * Auth      : Session-based authentication (Required)
 * Access    : Staff (userType >= 50)
 *
 * Description:
 *   Admin panel exposure of shop management endpoints.
 *   Shares the same service layer as the GM Tool shop
 *   module for consistency. All write operations are audited.
 * =====================================================
 */
import { Router } from "express";
import * as gmShopController from "../../../modules/gm-tool/shop/gmShop.controller.js";
import { requireStaff } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(requireStaff);

/* ---------- Shop Categories ---------- */
router.get("/categories", gmShopController.getCategories);
router.post("/categories", gmShopController.createCategory);
router.patch("/categories/:idx", gmShopController.patchCategory);

/* ---------- Shop Items ---------- */
router.get("/items", gmShopController.getItems);
router.post("/items", gmShopController.createItem);
router.patch("/items/:productNum", gmShopController.patchItem);
router.delete("/items/:productNum", gmShopController.deleteItem);

/* ---------- Mystery Shop Items ---------- */
router.get("/mystery/items", gmShopController.getMysteryItems);
router.post("/mystery/items", gmShopController.createMysteryItem);
router.patch("/mystery/items/:productId", gmShopController.patchMysteryItem);
router.delete("/mystery/items/:productId", gmShopController.deleteMysteryItem);

/* ---------- Mystery Shop User Data ---------- */
router.get("/mystery/user/:userNum", gmShopController.getMysteryUserData);
router.post("/mystery/user/:userNum", gmShopController.saveMysteryUserData);

export default router;
