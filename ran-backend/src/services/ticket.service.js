import { getUserPool, getWebPool } from "../loaders/mssql.js";
import { getMessage } from "../constants/messages.js";
import { logAction } from "./actionlog.service.js";
import { groupRepliesWithAttachments } from "./ticket/ticket.transforms.js";

/* =====================================================
   Helpers
===================================================== */

const isStaffUser = async (userNum) => {
  const pool = await getUserPool();

  const result = await pool.request().input("UserNum", userNum).query(`
      SELECT UserType
      FROM dbo.UserInfo
      WHERE UserNum = @UserNum
    `);

  return result.recordset.length > 0 && result.recordset[0].UserType >= 50;
};

/* =====================================================
   USER FUNCTIONS
===================================================== */
export const getTicketCategories = async () => {
  const pool = await getWebPool();

  const result = await pool.request().query(`
    SELECT
      CategoryID,
      CategoryName
    FROM dbo.TicketCategories
    WHERE IsActive = 1
    ORDER BY CategoryName ASC
  `);

  return { ok: true, categories: result.recordset };
};

export const createTicket = async (body, ctx = {}, files = []) => {
  const MSG = getMessage(ctx.lang);

  if (!body || typeof body !== "object") {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const { categoryId, subject, description, priority, characterName } = body;

  const gameId = ctx.user?.userid;

  if (!categoryId || !subject || !description) {
    return { ok: false, message: MSG.GENERAL.FILL_FORMS };
  }

  const webPool = await getWebPool();

  const categoryCheck = await webPool.request().input("CategoryID", categoryId)
    .query(`
      SELECT CategoryID
      FROM dbo.TicketCategories
      WHERE CategoryID = @CategoryID AND IsActive = 1
    `);

  if (categoryCheck.recordset.length === 0) {
    return { ok: false, message: MSG.TICKET.INVALID_CATEGORY };
  }

  const ticketPriority = priority || "Low";
  const transaction = webPool.transaction();

  try {
    await transaction.begin();

    const result = await transaction
      .request()
      .input("UserNum", ctx.user.userNum)
      .input("CategoryID", categoryId)
      .input("Subject", subject)
      .input("Description", description)
      .input("Priority", ticketPriority)
      .input("CharacterName", characterName || null)
      .input("GameID", gameId || null).query(`
        INSERT INTO dbo.Tickets
        (UserNum, CategoryID, Subject, Description, Priority, CharacterName, GameID)
        OUTPUT INSERTED.*
        VALUES
        (@UserNum, @CategoryID, @Subject, @Description, @Priority, @CharacterName, @GameID)
      `);

    const ticket = result.recordset[0];

    // Add Attachment Upload
    if (files && files.length > 0) {
      for (const file of files) {
        await transaction
          .request()
          .input("TicketID", ticket.TicketID)
          .input("FileName", file.originalname)
          .input("FilePath", file.filename)
          .input("FileSize", file.size)
          .input("FileType", file.mimetype)
          .input("UploadedByUserNum", ctx.user.userNum).query(`
        INSERT INTO dbo.TicketAttachments
        (TicketID, ReplyID, FileName, FilePath, FileSize, FileType, UploadedByUserNum, UploadedAt)
        VALUES
        (@TicketID, NULL, @FileName, @FilePath, @FileSize, @FileType, @UploadedByUserNum, GETDATE())
      `);
      }
    }

    await transaction
      .request()
      .input("TicketID", ticket.TicketID)
      .input("ActionType", "Created")
      .input("NewValue", "Ticket opened")
      .input("PerformedByUserNum", ctx.user.userNum).query(`
        INSERT INTO dbo.TicketHistory
        (TicketID, ActionType, NewValue, PerformedByUserNum)
        VALUES
        (@TicketID, @ActionType, @NewValue, @PerformedByUserNum)
      `);

    await transaction.commit();

    await logAction({
      userId: ctx.user.userNum,
      actionType: "CREATE",
      entityType: "TICKET",
      entityId: ticket.TicketID,
      description: `Created ticket: ${subject}`,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      ok: true,
      message: `Ticket #${ticket.TicketID} created successfully`,
      ticket,
    };
  } catch (err) {
    await transaction.rollback();
    return { ok: false, message: MSG.GENERAL.ERROR };
  }
};

export const getUserTickets = async (filters = {}, ctx = {}) => {
  const pool = await getWebPool();

  let query = `
    SELECT
      t.TicketID,
      t.Subject,
      t.Status,
      t.Priority,
      t.CreatedAt,
      t.UpdatedAt,
      tc.CategoryName,
      (SELECT COUNT(*) FROM dbo.TicketReplies r WHERE r.TicketID = t.TicketID) AS ReplyCount,
      (SELECT TOP 1 r.IsStaffReply FROM dbo.TicketReplies r
       WHERE r.TicketID = t.TicketID ORDER BY r.CreatedAt DESC) AS LastReplyIsStaff,
      (SELECT MAX(r.CreatedAt) FROM dbo.TicketReplies r
       WHERE r.TicketID = t.TicketID) AS LastReplyAt
    FROM dbo.Tickets t
    LEFT JOIN dbo.TicketCategories tc ON t.CategoryID = tc.CategoryID
    WHERE t.UserNum = @UserNum
  `;

  const request = pool.request().input("UserNum", ctx.user.userNum);

  if (filters.status) {
    query += " AND t.Status = @Status";
    request.input("Status", filters.status);
  }

  if (filters.categoryId) {
    query += " AND t.CategoryID = @CategoryID";
    request.input("CategoryID", filters.categoryId);
  }

  query += " ORDER BY COALESCE(t.UpdatedAt, t.CreatedAt) DESC";

  const result = await request.query(query);

  return { ok: true, tickets: result.recordset };
};

export const getTicketDetails = async (ticketId, ctx = {}) => {
  const MSG = getMessage(ctx.lang);
  if (!ticketId) return { ok: false, message: MSG.COMMON.INVALID_BODY };

  const pool = await getWebPool();

  // Validate ownership
  const ticketResult = await pool
    .request()
    .input("TicketID", ticketId)
    .input("UserNum", ctx.user.userNum).query(`
      SELECT *
      FROM dbo.Tickets
      WHERE TicketID = @TicketID AND UserNum = @UserNum
    `);

  if (ticketResult.recordset.length === 0) {
    return { ok: false, message: MSG.TICKET.NOT_FOUND };
  }

  // Fetch ticket-level attachments
  const attachmentsResult = await pool.request().input("TicketID", ticketId)
    .query(`
      SELECT
        AttachmentID,
        FileName,
        FilePath,
        FileSize,
        FileType,
        UploadedAt
      FROM dbo.TicketAttachments
      WHERE TicketID = @TicketID
        AND ReplyID IS NULL
      ORDER BY UploadedAt ASC
    `);

  // Fetch replies + reply attachments
  const repliesResult = await pool.request().input("TicketID", ticketId).query(`
      SELECT
        r.ReplyID,
        r.UserNum,
        r.Message,
        r.IsStaffReply,
        r.CreatedAt,
        u.UserID AS ReplyUserID,
        a.AttachmentID,
        a.FileName,
        a.FilePath,
        a.FileSize,
        a.FileType
      FROM dbo.TicketReplies r
      LEFT JOIN dbo.TicketAttachments a
        ON r.ReplyID = a.ReplyID
      LEFT JOIN [${process.env.DB_NAME_USER}].dbo.UserInfo u
        ON r.UserNum = u.UserNum
      WHERE r.TicketID = @TicketID
      ORDER BY r.CreatedAt ASC
    `);

  return {
    ok: true,
    ticket: ticketResult.recordset[0],
    replies: groupRepliesWithAttachments(repliesResult.recordset),
    attachments: attachmentsResult.recordset,
  };
};

export const addTicketReply = async (ticketId, body, ctx = {}, files = []) => {
  const MSG = getMessage(ctx.lang);

  if (!ticketId || !body?.message) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const pool = await getWebPool();

  // Validate ownership
  const ticketCheck = await pool
    .request()
    .input("TicketID", ticketId)
    .input("UserNum", ctx.user.userNum).query(`
      SELECT TicketID
      FROM dbo.Tickets
      WHERE TicketID = @TicketID AND UserNum = @UserNum
    `);

  if (ticketCheck.recordset.length === 0) {
    return { ok: false, message: MSG.TICKET.NOT_FOUND };
  }

  try {
    // Insert the reply
    const replyResult = await pool
      .request()
      .input("TicketID", ticketId)
      .input("UserNum", ctx.user.userNum)
      .input("Message", body.message).query(`
        INSERT INTO dbo.TicketReplies
        (TicketID, UserNum, Message, IsStaffReply)
        VALUES
        (@TicketID, @UserNum, @Message, 0);
        SELECT SCOPE_IDENTITY() AS ReplyID;
      `);

    const replyId = replyResult.recordset[0]?.ReplyID;

    // Insert attachments if present and ReplyID was obtained
    if (replyId && files && files.length > 0) {
      for (const file of files) {
        await pool
          .request()
          .input("TicketID", ticketId)
          .input("ReplyID", replyId)
          .input("FileName", file.originalname)
          .input("FilePath", file.filename)
          .input("FileSize", file.size)
          .input("FileType", file.mimetype)
          .input("UploadedByUserNum", ctx.user.userNum).query(`
            INSERT INTO dbo.TicketAttachments
            (TicketID, ReplyID, FileName, FilePath, FileSize, FileType, UploadedByUserNum, UploadedAt)
            VALUES
            (@TicketID, @ReplyID, @FileName, @FilePath, @FileSize, @FileType, @UploadedByUserNum, GETDATE())
          `);
      }
    }

    // Touch UpdatedAt for notification polling (best-effort)
    pool.request().input("TicketID", ticketId).query(`
      UPDATE dbo.Tickets SET UpdatedAt = GETDATE() WHERE TicketID = @TicketID
    `).catch(() => {});

    await logAction({
      userId: ctx.user?.userNum ?? null,
      actionType: "REPLY",
      entityType: "TICKET",
      entityId: ticketId,
      description: MSG.LOG.ACTION_TICKET_REPLY,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { ok: true, message: MSG.TICKET.REPLY_ADDED };
  } catch (err) {
    console.error("[addTicketReply] Error:", err);
    return { ok: false, message: MSG.GENERAL.ERROR };
  }
};

/* =====================================================
   STAFF FUNCTIONS (RESTORED)
===================================================== */

export const getAllTicketsStaff = async (filters = {}, ctx = {}) => {
  const MSG = getMessage(ctx.lang);
  if (!(await isStaffUser(ctx.user.userNum))) {
    return { ok: false, message: MSG.AUTH.STAFF_REQUIRED };
  }

  const pool = await getWebPool();
  const request = pool.request();

  let query = `
    SELECT
      t.TicketID,
      t.Subject,
      t.Status,
      t.Priority,
      t.CreatedAt,
      t.UpdatedAt,
      u.UserID AS Username,
      (SELECT COUNT(*) FROM dbo.TicketReplies r WHERE r.TicketID = t.TicketID) AS ReplyCount,
      (SELECT TOP 1 r.IsStaffReply FROM dbo.TicketReplies r
       WHERE r.TicketID = t.TicketID ORDER BY r.CreatedAt DESC) AS LastReplyIsStaff,
      (SELECT MAX(r.CreatedAt) FROM dbo.TicketReplies r
       WHERE r.TicketID = t.TicketID) AS LastReplyAt
    FROM dbo.Tickets t
    LEFT JOIN [${process.env.DB_NAME_USER}].dbo.UserInfo u
      ON t.UserNum = u.UserNum
    WHERE 1=1
  `;

  if (filters.status) {
    query += " AND t.Status = @Status";
    request.input("Status", filters.status);
  }

  query += " ORDER BY COALESCE(t.UpdatedAt, t.CreatedAt) DESC";

  const result = await request.query(query);
  return { ok: true, tickets: result.recordset };
};

export const getTicketDetailsStaff = async (ticketId, ctx = {}) => {
  const MSG = getMessage(ctx.lang);
  if (!(await isStaffUser(ctx.user.userNum))) {
    return { ok: false, message: MSG.AUTH.STAFF_REQUIRED };
  }

  const pool = await getWebPool();

  const result = await pool.request().input("TicketID", ticketId).query(`
      SELECT t.*, u.UserID AS AssignedStaffUserID
      FROM dbo.Tickets t
      LEFT JOIN [${process.env.DB_NAME_USER}].dbo.UserInfo u
        ON t.AssignedToStaffUserNum = u.UserNum
      WHERE t.TicketID = @TicketID
    `);

  if (result.recordset.length === 0) {
    return { ok: false, message: MSG.TICKET.NOT_FOUND };
  }

  // Fetch ticket-level attachments (not tied to a reply)
  const ticketAttachmentsResult = await pool.request().input("TicketID", ticketId).query(`
    SELECT AttachmentID, FileName, FilePath, FileSize, FileType
    FROM dbo.TicketAttachments
    WHERE TicketID = @TicketID AND ReplyID IS NULL
    ORDER BY UploadedAt ASC
  `);

  // Fetch replies with replier username
  const repliesResult = await pool.request().input("TicketID", ticketId).query(`
      SELECT
        r.ReplyID,
        r.UserNum,
        r.Message,
        r.IsStaffReply,
        r.CreatedAt,
        u.UserID AS ReplyUserID,
        a.AttachmentID,
        a.FileName,
        a.FilePath,
        a.FileSize,
        a.FileType
      FROM dbo.TicketReplies r
      LEFT JOIN dbo.TicketAttachments a
        ON r.ReplyID = a.ReplyID
      LEFT JOIN [${process.env.DB_NAME_USER}].dbo.UserInfo u
        ON r.UserNum = u.UserNum
      WHERE r.TicketID = @TicketID
      ORDER BY r.CreatedAt ASC
    `);

  return {
    ok: true,
    ticket: result.recordset[0],
    replies: groupRepliesWithAttachments(repliesResult.recordset),
    attachments: ticketAttachmentsResult.recordset,
  };
};

export const updateTicketStatus = async (ticketId, body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!(await isStaffUser(ctx.user.userNum))) {
    return { ok: false, message: MSG.AUTH.STAFF_REQUIRED };
  }

  if (!body?.status) {
    return { ok: false, message: MSG.COMMON.INVALID_BODY };
  }

  const pool = await getWebPool();

  await pool.request().input("TicketID", ticketId).input("Status", body.status)
    .query(`
      UPDATE dbo.Tickets
      SET Status = @Status, UpdatedAt = GETDATE()
      WHERE TicketID = @TicketID
    `);

  await logAction({
    userId: ctx.user?.userNum ?? null,
    actionType: "UPDATE",
    entityType: "TICKET",
    entityId: ticketId,
    description: MSG.LOG.ACTION_TICKET_STATUS_UPDATE,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.TICKET.STATUS_UPDATED };
};

export const updateTicketPriority = async (ticketId, body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!(await isStaffUser(ctx.user.userNum))) {
    return { ok: false, message: MSG.AUTH.STAFF_REQUIRED };
  }

  const validPriorities = ["Low", "Medium", "High", "Critical"];
  if (!body?.priority || !validPriorities.includes(body.priority)) {
    return { ok: false, message: MSG.TICKET.INVALID_PRIORITY };
  }

  const pool = await getWebPool();

  await pool.request().input("TicketID", ticketId).input("Priority", body.priority)
    .query(`
      UPDATE dbo.Tickets
      SET Priority = @Priority, UpdatedAt = GETDATE()
      WHERE TicketID = @TicketID
    `);

  await logAction({
    userId: ctx.user?.userNum ?? null,
    actionType: "UPDATE",
    entityType: "TICKET",
    entityId: ticketId,
    description: `Updated ticket priority to ${body.priority}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.TICKET.PRIORITY_UPDATED };
};

export const assignTicketToStaff = async (ticketId, body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);

  if (!(await isStaffUser(ctx.user.userNum))) {
    return { ok: false, message: MSG.AUTH.STAFF_REQUIRED };
  }

  const pool = await getWebPool();

  await pool
    .request()
    .input("TicketID", ticketId)
    .input("StaffUserNum", body.staffUserNum).query(`
      UPDATE dbo.Tickets
      SET AssignedToStaffUserNum = @StaffUserNum, UpdatedAt = GETDATE()
      WHERE TicketID = @TicketID
    `);

  await logAction({
    userId: ctx.user?.userNum ?? null,
    actionType: "ASSIGN",
    entityType: "TICKET",
    entityId: ticketId,
    description: MSG.LOG.ACTION_TICKET_ASSIGN,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, message: MSG.TICKET.ASSIGNED };
};

export const addStaffReply = async (ticketId, body, ctx = {}, files = []) => {
  const MSG = getMessage(ctx.lang);

  if (!(await isStaffUser(ctx.user.userNum))) {
    return { ok: false, message: MSG.AUTH.STAFF_REQUIRED };
  }

  const pool = await getWebPool();

  try {
    const replyResult = await pool
      .request()
      .input("TicketID", ticketId)
      .input("UserNum", ctx.user.userNum)
      .input("Message", body.message ?? "").query(`
        INSERT INTO dbo.TicketReplies
        (TicketID, UserNum, Message, IsStaffReply)
        VALUES (@TicketID, @UserNum, @Message, 1);
        SELECT SCOPE_IDENTITY() AS ReplyID;
      `);

    const replyId = replyResult.recordset[0]?.ReplyID;

    if (replyId && files && files.length > 0) {
      for (const file of files) {
        await pool
          .request()
          .input("TicketID", ticketId)
          .input("ReplyID", replyId)
          .input("FileName", file.originalname)
          .input("FilePath", file.filename)
          .input("FileSize", file.size)
          .input("FileType", file.mimetype)
          .input("UploadedByUserNum", ctx.user.userNum).query(`
            INSERT INTO dbo.TicketAttachments
            (TicketID, ReplyID, FileName, FilePath, FileSize, FileType, UploadedByUserNum, UploadedAt)
            VALUES
            (@TicketID, @ReplyID, @FileName, @FilePath, @FileSize, @FileType, @UploadedByUserNum, GETDATE())
          `);
      }
    }

    // Touch UpdatedAt for notification polling (best-effort)
    pool.request().input("TicketID", ticketId).query(`
      UPDATE dbo.Tickets SET UpdatedAt = GETDATE() WHERE TicketID = @TicketID
    `).catch(() => {});

    await logAction({
      userId: ctx.user?.userNum ?? null,
      actionType: "REPLY",
      entityType: "TICKET",
      entityId: ticketId,
      description: MSG.LOG.ACTION_TICKET_REPLY,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { ok: true, message: MSG.TICKET.REPLY_ADDED };
  } catch (err) {
    console.error("[addStaffReply] Error:", err);
    return { ok: false, message: MSG.GENERAL.ERROR };
  }
};

export const getStaffList = async () => {
  const pool = await getUserPool();

  const result = await pool.request().query(`
    SELECT UserNum, UserID, UserType
    FROM dbo.UserInfo
    WHERE UserType >= 50
  `);

  return { ok: true, staff: result.recordset };
};
