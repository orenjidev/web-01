/**
 * =====================================================
 * Ticket API
 * =====================================================
 * Base Path : /api/tickets
 *
 * Description:
 *   Ticketing system endpoints for users and staff,
 *   including ticket creation, replies, status updates,
 *   and assignment workflows.
 *
 * Feature Flag:
 *   - baseServerConfig.features.ticketSystem must be true
 *
 * Notes:
 *   - Ticket system availability is enforced globally
 *   - Public, user, and staff routes are separated
 * =====================================================
 */
import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import {
  requireAuth,
  requireStaff,
  requireTicketSystem,
} from "../middlewares/auth.middleware.js";
import { ticketUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(requireTicketSystem);

/**
 * =====================================================
 * Public Routes
 * =====================================================
 */

/**
 * -----------------------------------------------------
 * GET /api/tickets/categories
 * -----------------------------------------------------
 * Description:
 *   Retrieve available ticket categories.
 *
 * Auth:
 *   - Public
 *
 * Success Response:
 *   - JSON data returned by ticket service
 *
 * Error Response:
 *   - Not explicitly defined at controller level
 */
router.get("/categories", ticketController.getTicketCategoriesController);

/**
 * =====================================================
 * User Routes (Authenticated)
 * =====================================================
 */

/**
 * -----------------------------------------------------
 * POST /api/tickets/create
 * -----------------------------------------------------
 * Description:
 *   Create a new support ticket.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Request Body:
 *   - Passed directly to ticketService.createTicket
 *   - Required fields are service-defined
 *
 * Success Response:
 *   - 201 Created
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 400 Bad Request
 *   {
 *     ok      : false,
 *     message : string
 *   }
 */
//router.post("/create", requireAuth, ticketController.createTicketController);
router.post(
  "/create",
  requireAuth,
  ticketUpload.array("attachments", 5),
  ticketController.createTicketController,
);

// Soon If this is needed
// router.get(
//   "/tickets/:ticketId/attachments/:fileName",
//   requireAuth,
//   async (req, res) => {
//     const { ticketId, fileName } = req.params;
//     const user = req.ctx.user;

//     // 1. Check ticket exists
//     const ticket = await ticketService.getTicket(ticketId);

//     if (!ticket) {
//       return res.status(404).send("Not found");
//     }

//     // 2. Check ownership or staff role
//     const isOwner = ticket.UserNum === user.userNum;
//     const isStaff = user.type >= 50; // adjust based on your system

//     if (!isOwner && !isStaff) {
//       return res.status(403).send("Forbidden");
//     }

//     // 3. Serve file
//     const filePath = path.join(process.cwd(), "uploads", "tickets", fileName);

//     res.sendFile(filePath);
//   },
// );

/**
 * -----------------------------------------------------
 * GET /api/tickets/my-tickets
 * -----------------------------------------------------
 * Description:
 *   Retrieve tickets created by the authenticated user.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Query Parameters:
 *   - status      : string (optional)
 *   - categoryId  : number (optional)
 *
 * Success Response:
 *   - JSON object returned by service
 */
router.get(
  "/my-tickets",
  requireAuth,
  ticketController.getUserTicketsController,
);

/**
 * -----------------------------------------------------
 * GET /api/tickets/:ticketId
 * -----------------------------------------------------
 * Description:
 *   Retrieve details of a specific ticket owned by the user.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Route Params:
 *   - ticketId : number | string (required)
 *
 * Success Response:
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 404 Not Found
 *   {
 *     ok      : false,
 *     message : string
 *   }
 */
router.get(
  "/:ticketId",
  requireAuth,
  ticketController.getTicketDetailsController,
);

/**
 * -----------------------------------------------------
 * POST /api/tickets/:ticketId/reply
 * -----------------------------------------------------
 * Description:
 *   Add a reply to an existing ticket as the ticket owner.
 *
 * Auth:
 *   - Authenticated user required
 *
 * Route Params:
 *   - ticketId : number | string (required)
 *
 * Request Body:
 *   - Passed directly to ticketService.addTicketReply
 *
 * Success Response:
 *   - 201 Created
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 400 Bad Request
 */
router.post(
  "/:ticketId/reply",
  requireAuth,
  ticketUpload.array("attachments", 5),
  ticketController.addTicketReplyController,
);

/**
 * =====================================================
 * Staff Routes (UserType >= 50)
 * =====================================================
 */

router.use(requireStaff);
/**
 * -----------------------------------------------------
 * GET /api/tickets/staff/all
 * -----------------------------------------------------
 * Description:
 *   Retrieve all tickets for staff review.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Query Parameters:
 *   - status         : string (optional)
 *   - categoryId     : number (optional)
 *   - assignedToMe   : boolean (optional)
 *   - priority       : string (optional)
 *
 * Success Response:
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 403 Forbidden
 */
router.get("/staff/all", ticketController.getAllTicketsStaffController);

/**
 * -----------------------------------------------------
 * GET /api/tickets/staff/list
 * -----------------------------------------------------
 * Description:
 *   Retrieve list of staff users available for ticket assignment.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Success Response:
 *   - JSON object returned by service
 */
router.get("/staff/list", ticketController.getStaffListController);

/**
 * -----------------------------------------------------
 * GET /api/tickets/staff/:ticketId
 * -----------------------------------------------------
 * Description:
 *   Retrieve ticket details with staff-level access.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Route Params:
 *   - ticketId : number | string (required)
 *
 * Success Response:
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 404 Not Found
 */
router.get(
  "/staff/:ticketId",
  ticketController.getTicketDetailsStaffController,
);

/**
 * -----------------------------------------------------
 * PUT /api/tickets/staff/:ticketId/status
 * -----------------------------------------------------
 * Description:
 *   Update the status of a ticket.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Route Params:
 *   - ticketId : number | string (required)
 *
 * Request Body:
 *   - Passed directly to ticketService.updateTicketStatus
 *
 * Success Response:
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 400 Bad Request
 */
router.put(
  "/staff/:ticketId/status",
  ticketController.updateTicketStatusController,
);

/**
 * -----------------------------------------------------
 * PUT /api/tickets/staff/:ticketId/assign
 * -----------------------------------------------------
 * Description:
 *   Assign a ticket to a staff member.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Route Params:
 *   - ticketId : number | string (required)
 *
 * Request Body:
 *   - Passed directly to ticketService.assignTicketToStaff
 *
 * Success Response:
 *   - JSON object returned by service
 *
 * Error Response:
 *   - 400 Bad Request
 */
router.put(
  "/staff/:ticketId/assign",
  ticketController.assignTicketToStaffController,
);

/**
 * -----------------------------------------------------
 * POST /api/tickets/staff/:ticketId/reply
 * -----------------------------------------------------
 * Description:
 *   Add a reply to a ticket as staff.
 *
 * Auth:
 *   - Staff authentication required
 *
 * Route Params:
 *   - ticketId : number | string (required)
 *
 * Request Body:
 *   - Passed directly to ticketService.addStaffReply
 *
 * Success Response:
 *   - 201 Created
 *
 * Error Response:
 *   - 400 Bad Request
 */
router.post(
  "/staff/:ticketId/reply",
  ticketUpload.array("attachments", 5),
  ticketController.addStaffReplyController,
);

export default router;
