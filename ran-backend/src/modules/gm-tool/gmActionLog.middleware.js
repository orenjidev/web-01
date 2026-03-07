import { requireAuth } from "../../api/middlewares/auth.middleware.js";
import { logGmAction } from "../../services/actionLogGM.service.js";

/**
 * Route-to-action-type mapping.
 * Maps HTTP method + path pattern to { actionType, entityType }.
 * Order matters: more specific patterns must come before general ones.
 */
const ROUTE_MAP = [
  // === CHARACTER ===
  {
    method: "GET",
    pattern: /^\/character\/search/,
    actionType: "SEARCH_CHARACTERS",
    entityType: "CHARACTER",
  },
  {
    method: "GET",
    pattern: /^\/character\/(\d+)\/skills/,
    actionType: "VIEW_CHARACTER_SKILLS",
    entityType: "CHARACTER",
    entityParam: 1,
  },
  {
    method: "PUT",
    pattern: /^\/character\/(\d+)\/skills/,
    actionType: "UPDATE_CHARACTER_SKILLS",
    entityType: "CHARACTER",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/character\/(\d+)\/puton/,
    actionType: "VIEW_PUTON_ITEMS",
    entityType: "CHARACTER",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/character\/(\d+)\/puton\/save/,
    actionType: "SAVE_PUTON_ITEMS",
    entityType: "CHARACTER",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/character\/(\d+)/,
    actionType: "VIEW_CHARACTER",
    entityType: "CHARACTER",
    entityParam: 1,
  },
  {
    method: "PATCH",
    pattern: /^\/character\/(\d+)/,
    actionType: "UPDATE_CHARACTER",
    entityType: "CHARACTER",
    entityParam: 1,
  },

  // === USER ===
  {
    method: "GET",
    pattern: /^\/users$/,
    actionType: "SEARCH_USERS",
    entityType: "USER",
  },
  {
    method: "POST",
    pattern: /^\/users$/,
    actionType: "CREATE_USER",
    entityType: "USER",
  },
  {
    method: "GET",
    pattern: /^\/users\/(\d+)\/login-logs/,
    actionType: "VIEW_LOGIN_LOGS",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "DELETE",
    pattern: /^\/users\/(\d+)\/login-logs/,
    actionType: "CLEAR_LOGIN_LOGS",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/users\/(\d+)\/characters/,
    actionType: "VIEW_USER_CHARACTERS",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/users\/(\d+)\/referrals/,
    actionType: "VIEW_USER_REFERRALS",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/users\/(\d+)\/block/,
    actionType: "BLOCK_USER",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/users\/(\d+)\/chat-block/,
    actionType: "CHAT_BLOCK_USER",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/users\/(\d+)\/force-offline/,
    actionType: "FORCE_OFFLINE_USER",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/users\/([^/]+)\/bank$/,
    actionType: "VIEW_USER_BANK",
    entityType: "USER_BANK",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/users\/([^/]+)\/bank\/clear/,
    actionType: "CLEAR_USER_BANK",
    entityType: "USER_BANK",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/users\/([^/]+)\/bank\/([^/]+)\/taken/,
    actionType: "SET_BANK_TAKEN",
    entityType: "USER_BANK",
    entityParam: 2,
  },
  {
    method: "POST",
    pattern: /^\/users\/([^/]+)\/bank$/,
    actionType: "INSERT_BANK_ITEM",
    entityType: "USER_BANK",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/users\/(\d+)$/,
    actionType: "VIEW_USER",
    entityType: "USER",
    entityParam: 1,
  },
  {
    method: "PUT",
    pattern: /^\/users\/(\d+)$/,
    actionType: "SAVE_USER",
    entityType: "USER",
    entityParam: 1,
  },

  // === TOPUP ===
  {
    method: "GET",
    pattern: /^\/topups$/,
    actionType: "LIST_TOPUPS",
    entityType: "TOPUP",
  },
  {
    method: "POST",
    pattern: /^\/topups\/generate/,
    actionType: "GENERATE_TOPUPS",
    entityType: "TOPUP",
  },
  {
    method: "POST",
    pattern: /^\/topups\/(\d+)\/use/,
    actionType: "SET_TOPUP_USED",
    entityType: "TOPUP",
    entityParam: 1,
  },

  // === PCID ===
  {
    method: "GET",
    pattern: /^\/pcid$/,
    actionType: "LIST_PCID_BLOCKS",
    entityType: "PCID",
  },
  {
    method: "POST",
    pattern: /^\/pcid$/,
    actionType: "INSERT_PCID_BLOCK",
    entityType: "PCID",
  },
  {
    method: "DELETE",
    pattern: /^\/pcid\/(\d+)/,
    actionType: "DELETE_PCID_BLOCK",
    entityType: "PCID",
    entityParam: 1,
  },

  // === SHOP CATEGORIES ===
  {
    method: "GET",
    pattern: /^\/shop\/categories$/,
    actionType: "LIST_SHOP_CATEGORIES",
    entityType: "SHOP_CATEGORY",
  },
  {
    method: "POST",
    pattern: /^\/shop\/categories$/,
    actionType: "CREATE_SHOP_CATEGORY",
    entityType: "SHOP_CATEGORY",
  },
  {
    method: "PATCH",
    pattern: /^\/shop\/categories\/(\d+)/,
    actionType: "UPDATE_SHOP_CATEGORY",
    entityType: "SHOP_CATEGORY",
    entityParam: 1,
  },

  // === SHOP ITEMS ===
  {
    method: "GET",
    pattern: /^\/shop\/items$/,
    actionType: "LIST_SHOP_ITEMS",
    entityType: "SHOP_ITEM",
  },
  {
    method: "POST",
    pattern: /^\/shop\/items$/,
    actionType: "CREATE_SHOP_ITEM",
    entityType: "SHOP_ITEM",
  },
  {
    method: "PATCH",
    pattern: /^\/shop\/items\/(\d+)/,
    actionType: "UPDATE_SHOP_ITEM",
    entityType: "SHOP_ITEM",
    entityParam: 1,
  },
  {
    method: "DELETE",
    pattern: /^\/shop\/items\/(\d+)/,
    actionType: "DISABLE_SHOP_ITEM",
    entityType: "SHOP_ITEM",
    entityParam: 1,
  },

  // === MYSTERY SHOP ITEMS ===
  {
    method: "GET",
    pattern: /^\/shop\/mystery\/items$/,
    actionType: "LIST_MYSTERY_ITEMS",
    entityType: "MYSTERY_ITEM",
  },
  {
    method: "POST",
    pattern: /^\/shop\/mystery\/items$/,
    actionType: "CREATE_MYSTERY_ITEM",
    entityType: "MYSTERY_ITEM",
  },
  {
    method: "PATCH",
    pattern: /^\/shop\/mystery\/items\/(\d+)/,
    actionType: "UPDATE_MYSTERY_ITEM",
    entityType: "MYSTERY_ITEM",
    entityParam: 1,
  },
  {
    method: "DELETE",
    pattern: /^\/shop\/mystery\/items\/(\d+)/,
    actionType: "DISABLE_MYSTERY_ITEM",
    entityType: "MYSTERY_ITEM",
    entityParam: 1,
  },

  // === MYSTERY SHOP USER DATA ===
  {
    method: "GET",
    pattern: /^\/shop\/mystery\/user\/(\d+)/,
    actionType: "VIEW_MYSTERY_USER",
    entityType: "MYSTERY_USER",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/shop\/mystery\/user\/(\d+)/,
    actionType: "SAVE_MYSTERY_USER",
    entityType: "MYSTERY_USER",
    entityParam: 1,
  },

  // === DASHBOARD (admin panel) ===
  {
    method: "GET",
    pattern: /^\/dashboard\/trend/,
    actionType: "VIEW_DASHBOARD_TREND",
    entityType: "DASHBOARD",
  },
  {
    method: "GET",
    pattern: /^\/dashboard\/stat-per-school/,
    actionType: "VIEW_STAT_PER_SCHOOL",
    entityType: "DASHBOARD",
  },
  {
    method: "GET",
    pattern: /^\/dashboard\/stat-per-class/,
    actionType: "VIEW_STAT_PER_CLASS",
    entityType: "DASHBOARD",
  },
  {
    method: "GET",
    pattern: /^\/dashboard$/,
    actionType: "VIEW_DASHBOARD",
    entityType: "DASHBOARD",
  },

  // === SHOP CATEGORY DELETE ===
  {
    method: "DELETE",
    pattern: /^\/shop\/categories\/(\d+)/,
    actionType: "DELETE_SHOP_CATEGORY",
    entityType: "SHOP_CATEGORY",
    entityParam: 1,
  },

  // === SHOP ANALYTICS ===
  {
    method: "GET",
    pattern: /^\/shop\/analytics\/overview/,
    actionType: "VIEW_SHOP_ANALYTICS_OVERVIEW",
    entityType: "SHOP_ANALYTICS",
  },
  {
    method: "GET",
    pattern: /^\/shop\/analytics\/top-items/,
    actionType: "VIEW_TOP_ITEMS_ANALYTICS",
    entityType: "SHOP_ANALYTICS",
  },
  {
    method: "GET",
    pattern: /^\/shop\/analytics\/revenue/,
    actionType: "VIEW_REVENUE_ANALYTICS",
    entityType: "SHOP_ANALYTICS",
  },
  {
    method: "GET",
    pattern: /^\/shop\/analytics\/daily-trend/,
    actionType: "VIEW_DAILY_TREND_ANALYTICS",
    entityType: "SHOP_ANALYTICS",
  },
  {
    method: "GET",
    pattern: /^\/shop\/analytics\/recent/,
    actionType: "VIEW_RECENT_ANALYTICS",
    entityType: "SHOP_ANALYTICS",
  },

  // === TICKETS ===
  // Specific sub-routes before general /:ticketId to prevent premature matching
  {
    method: "GET",
    pattern: /^\/tickets\/all/,
    actionType: "LIST_ALL_TICKETS",
    entityType: "TICKET",
  },
  {
    method: "GET",
    pattern: /^\/tickets\/list/,
    actionType: "LIST_STAFF_TICKETS",
    entityType: "TICKET",
  },
  {
    method: "PUT",
    pattern: /^\/tickets\/([^/]+)\/status/,
    actionType: "UPDATE_TICKET_STATUS",
    entityType: "TICKET",
    entityParam: 1,
  },
  {
    method: "PUT",
    pattern: /^\/tickets\/([^/]+)\/priority/,
    actionType: "UPDATE_TICKET_PRIORITY",
    entityType: "TICKET",
    entityParam: 1,
  },
  {
    method: "PUT",
    pattern: /^\/tickets\/([^/]+)\/assign/,
    actionType: "ASSIGN_TICKET",
    entityType: "TICKET",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/tickets\/([^/]+)\/reply/,
    actionType: "STAFF_REPLY_TICKET",
    entityType: "TICKET",
    entityParam: 1,
  },
  {
    method: "GET",
    pattern: /^\/tickets\/([^/]+)$/,
    actionType: "VIEW_TICKET",
    entityType: "TICKET",
    entityParam: 1,
  },

  // === TICKET CATEGORIES ===
  {
    method: "GET",
    pattern: /^\/ticket-categories$/,
    actionType: "LIST_TICKET_CATEGORIES",
    entityType: "TICKET_CATEGORY",
  },
  {
    method: "POST",
    pattern: /^\/ticket-categories$/,
    actionType: "CREATE_TICKET_CATEGORY",
    entityType: "TICKET_CATEGORY",
  },
  {
    method: "PATCH",
    pattern: /^\/ticket-categories\/(\d+)/,
    actionType: "UPDATE_TICKET_CATEGORY",
    entityType: "TICKET_CATEGORY",
    entityParam: 1,
  },
  {
    method: "DELETE",
    pattern: /^\/ticket-categories\/(\d+)/,
    actionType: "DELETE_TICKET_CATEGORY",
    entityType: "TICKET_CATEGORY",
    entityParam: 1,
  },

  // === SERVER CONFIG ===
  {
    method: "GET",
    pattern: /^\/server-config$/,
    actionType: "VIEW_SERVER_CONFIG",
    entityType: "SERVER_CONFIG",
  },
  {
    method: "PUT",
    pattern: /^\/server-config\/([^/]+)/,
    actionType: "UPDATE_SERVER_CONFIG",
    entityType: "SERVER_CONFIG",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/server-config\/upload-image/,
    actionType: "UPLOAD_SLIDER_IMAGE",
    entityType: "SERVER_CONFIG",
  },
  {
    method: "POST",
    pattern: /^\/server-config\/upload-static/,
    actionType: "UPLOAD_STATIC_IMAGE",
    entityType: "SERVER_CONFIG",
  },

  // === MASTER CONTROL ===
  {
    method: "POST",
    pattern: /^\/master\/reset/,
    actionType: "MASTER_RESET",
    entityType: "MASTER",
  },

  // === BUILD ITEMS ===
  {
    method: "GET",
    pattern: /^\/build-items\/preview/,
    actionType: "VIEW_ITEMS_BUILD_PREVIEW",
    entityType: "BUILD",
  },
  {
    method: "GET",
    pattern: /^\/build-items\/item\/([^/]+)/,
    actionType: "VIEW_BUILD_ITEM",
    entityType: "BUILD",
    entityParam: 1,
  },
  {
    method: "POST",
    pattern: /^\/build-items\/upload/,
    actionType: "UPLOAD_ITEMS_CSV",
    entityType: "BUILD",
  },
  {
    method: "POST",
    pattern: /^\/build-items\/build/,
    actionType: "BUILD_ITEMS",
    entityType: "BUILD",
  },

  // === BUILD SKILLS ===
  {
    method: "GET",
    pattern: /^\/build-skills\/preview/,
    actionType: "VIEW_SKILLS_BUILD_PREVIEW",
    entityType: "BUILD",
  },
  {
    method: "GET",
    pattern: /^\/build-skills\/skill\/([^/]+)/,
    actionType: "VIEW_BUILD_SKILL",
    entityType: "BUILD",
    entityParam: 1,
  },
  // upload-strings before upload to prevent prefix match
  {
    method: "POST",
    pattern: /^\/build-skills\/upload-strings/,
    actionType: "UPLOAD_SKILL_STRINGS",
    entityType: "BUILD",
  },
  {
    method: "POST",
    pattern: /^\/build-skills\/upload/,
    actionType: "UPLOAD_SKILLS_CSV",
    entityType: "BUILD",
  },
  {
    method: "POST",
    pattern: /^\/build-skills\/build/,
    actionType: "BUILD_SKILLS",
    entityType: "BUILD",
  },

  // === TOPUP ADMIN (middleware applied inside adminRouter — req.path is relative to adminRouter) ===
  {
    method: "GET",
    pattern: /^\/list/,
    actionType: "LIST_TOPUPS_ADMIN",
    entityType: "TOPUP",
  },
  {
    method: "POST",
    pattern: /^\/generate/,
    actionType: "GENERATE_TOPUPS_ADMIN",
    entityType: "TOPUP",
  },
  {
    method: "PATCH",
    pattern: /^\/(\d+)\/unused/,
    actionType: "SET_TOPUP_UNUSED",
    entityType: "TOPUP",
    entityParam: 1,
  },
];

/**
 * Resolve the action descriptor from an incoming request.
 */
function resolveAction(method, path) {
  for (const route of ROUTE_MAP) {
    if (route.method !== method) continue;
    const match = path.match(route.pattern);
    if (match) {
      return {
        actionType: route.actionType,
        entityType: route.entityType,
        entityId: route.entityParam ? match[route.entityParam] : null,
      };
    }
  }
  return {
    actionType: `${method}_UNKNOWN`,
    entityType: "UNKNOWN",
    entityId: null,
  };
}

/**
 * GM Action Log Middleware.
 * Attaches a response finish listener to log after the request completes.
 * This captures the response status code for the log entry.
 */
export const gmActionLogMiddleware = (req, res, next) => {
  const relativePath = req.path;
  const fullPath = req.originalUrl;
  const action = resolveAction(req.method, relativePath);
  const user = req.session?.user;

  res.on("finish", () => {
    if (!user) return;
    const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
    const shouldLogBody = req.method !== "GET" && req.method !== "HEAD";

    logGmAction({
      gmUserNum: user?.userNum,
      gmUserId: user?.userid ?? null,
      gmUserType: user?.type ?? null,
      actionType: action.actionType,
      httpMethod: req.method,
      httpPath: fullPath,
      entityType: action.entityType,
      entityId: action.entityId,
      description: `${action.actionType} via ${req.method} ${relativePath}`,
      requestBody: shouldLogBody ? req.body : null,
      metadata: null,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null,
      success: isSuccess,
      responseStatus: res.statusCode,
    });
  });

  next();
};
