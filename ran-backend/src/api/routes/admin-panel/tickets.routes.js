import { Router } from "express";
import * as ticketController from "../../controllers/ticket.controller.js";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { ticketUpload, validateMimeType } from "../../middlewares/upload.middleware.js";

const TICKET_ALLOWED_MIMES = ["image/jpeg", "image/png", "application/pdf"];

async function validateTicketFiles(req, res, next) {
  try {
    if (req.files?.length) {
      for (const file of req.files) {
        await validateMimeType(file, TICKET_ALLOWED_MIMES);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireStaff);

/* GET /api/adminpanel/tickets/all */
router.get("/all", ticketController.getAllTicketsStaffController);

/* GET /api/adminpanel/tickets/list */
router.get("/list", ticketController.getStaffListController);

/* GET /api/adminpanel/tickets/:ticketId */
router.get("/:ticketId", ticketController.getTicketDetailsStaffController);

/* PUT /api/adminpanel/tickets/:ticketId/status */
router.put("/:ticketId/status", ticketController.updateTicketStatusController);

/* PUT /api/adminpanel/tickets/:ticketId/priority */
router.put("/:ticketId/priority", ticketController.updateTicketPriorityController);

/* PUT /api/adminpanel/tickets/:ticketId/assign */
router.put("/:ticketId/assign", ticketController.assignTicketToStaffController);

/* POST /api/adminpanel/tickets/:ticketId/reply */
router.post(
  "/:ticketId/reply",
  ticketUpload.array("attachments", 5),
  validateTicketFiles,
  ticketController.addStaffReplyController,
);

export default router;
