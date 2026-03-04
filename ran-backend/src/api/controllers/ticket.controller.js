import * as ticketService from "../../services/ticket.service.js";
import { getMessage } from "../../constants/messages.js";
import { baseServerConfig } from "../../config/server.config.js";

/* -------------------------
   Helpers
-------------------------- */

const requireTicketSystemEnabled = (req, res) => {
  const MSG = getMessage(req.ctx.lang);

  if (!baseServerConfig.features.ticketSystem) {
    res.status(403).json({
      ok: false,
      message: MSG.FEATURE.TICKET_SYSTEM_DISABLED,
    });
    return false;
  }
  return true;
};

/* =========================
   USER CONTROLLERS
========================= */

// export const createTicketController = async (req, res) => {
//   if (!requireTicketSystemEnabled(req, res)) return;

//   const result = await ticketService.createTicket(req.body, req.ctx);

//   if (!result.ok) {
//     return res.status(400).json(result);
//   }

//   return res.status(201).json(result);
// };
export const createTicketController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.createTicket(req.body, req.ctx, req.files);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.status(201).json(result);
};

export const getUserTicketsController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const filters = {
    status: req.query.status,
    categoryId: req.query.categoryId,
  };

  const result = await ticketService.getUserTickets(filters, req.ctx);
  return res.json(result);
};

export const getTicketDetailsController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.getTicketDetails(
    req.params.ticketId,
    req.ctx,
  );

  if (!result.ok) {
    return res.status(404).json(result);
  }

  return res.json(result);
};

export const addTicketReplyController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.addTicketReply(
    req.params.ticketId,
    req.body,
    req.ctx,
    req.files, // <-- THIS is the only required addition
  );

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.status(201).json(result);
};

export const getTicketCategoriesController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.getTicketCategories(req.ctx);
  return res.json(result);
};

/* =========================
   STAFF CONTROLLERS
========================= */

export const getAllTicketsStaffController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const filters = {
    status: req.query.status,
    categoryId: req.query.categoryId,
    assignedToMe: req.query.assignedToMe === "true",
    priority: req.query.priority,
  };

  const result = await ticketService.getAllTicketsStaff(filters, req.ctx);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const getTicketDetailsStaffController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.getTicketDetailsStaff(
    req.params.ticketId,
    req.ctx,
  );

  if (!result.ok) {
    return res.status(404).json(result);
  }

  return res.json(result);
};

export const updateTicketStatusController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.updateTicketStatus(
    req.params.ticketId,
    req.body,
    req.ctx,
  );

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const updateTicketPriorityController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.updateTicketPriority(
    req.params.ticketId,
    req.body,
    req.ctx,
  );

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const assignTicketToStaffController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.assignTicketToStaff(
    req.params.ticketId,
    req.body,
    req.ctx,
  );

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.json(result);
};

export const addStaffReplyController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.addStaffReply(
    req.params.ticketId,
    req.body,
    req.ctx,
    req.files,
  );

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.status(201).json(result);
};

export const getStaffListController = async (req, res) => {
  if (!requireTicketSystemEnabled(req, res)) return;

  const result = await ticketService.getStaffList(req.ctx);
  return res.json(result);
};
