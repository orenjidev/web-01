const messages = {
  en: {
    /* -------------------------
       Auth / Guards
    -------------------------- */

    AUTH_GUARD: {
      NOT_LOGGED_IN: "Please login to continue",
      INSUFFICIENT_PERMISSION: "Unable to use this functionality",
    },

    AUTH: {
      LOGIN_REQUIRED: "Please login to continue",
      STAFF_REQUIRED: "Staff access required. Insufficient permissions",

      USER_PASS_MISMATCH: "Invalid username or password",
      USER_PASS_LENGTH_CHECK: "Username or password length is invalid",
      USER_PASS_SPECIAL_CHAR_CHECK:
        "Username or password contains invalid characters",

      PASSWORD_MISMATCH: "Incorrect password",
      PASSWORD_MISMATCH_NEW: "New passwords do not match",
      PASSWORD_CHANGED: "Password changed successfully",

      ACCOUNT_DISABLED: "This account has been disabled",
      ACCOUNT_BLOCKED: "This account has been blocked",
      INVALID_REQ: "Invalid authentication request",

      LOGOUT_SUCCESS: "You have been logged out successfully",
      UNAUTHORIZED: "You are not authorized to perform this action",
    },

    /* -------------------------
       Feature Flags
    -------------------------- */

    FEATURE: {
      SHOP_DISABLED: "Shop is currently disabled",
      TOPUP_DISABLED: "Top-up service is currently disabled",
      TICKET_SYSTEM_DISABLED: "Ticket system is currently disabled",

      CHANGE_PASSWORD_DISABLED: "Change password feature is currently disabled",
      CHANGE_PIN_DISABLED: "Change pincode feature is currently disabled",
      CHANGE_EMAIL_DISABLED: "Change email feature is currently disabled",

      CHANGE_SCHOOL_DISABLED: "Change school feature is currently disabled",
      RESET_STATS_DISABLED: "Reset stats feature is currently disabled",
      CHANGE_CLASS_DISABLED: "Change class feature is currently disabled",
      REBORN_DISABLED: "Reborn feature is currently disabled",
      CHARACTER_DELETE_DISABLED:
        "Character deletion feature is currently disabled",
    },

    /* -------------------------
       Common / General
    -------------------------- */

    COMMON: {
      INVALID_BODY: "Invalid request body",
      BUFFER_SIZE: "Invalid request structure",
      NOT_FOUND: "The requested record was not found",
      UNABLE_TO_USE_FUNCTIONALITY: "Unable to use this functionality",
    },

    GENERAL: {
      INVALID_BODY: "Invalid request data",
      BUFFER_SIZE: "Invalid request structure",
      FILL_FORMS: "Please fill in all required fields",
      INVALID_CHARS: "Invalid characters detected",
      SUCCESS: "Success",
      ERROR: "An unexpected error occurred",
    },

    /* -------------------------
       Login / Register
    -------------------------- */

    LOGIN: {
      SUCCESS: (userid) => `Welcome back, ${userid}`,
    },

    REGISTER: {
      SUCCESS: "Registration successful",
      LENGTH_RULE: "Input length does not meet requirements",
      PASSWORD_CONFIRM_MISMATCH: "Passwords do not match",
      PINCODE_CONFIRM_MISMATCH: "Pincodes do not match",
      USERNAME_TAKEN: "Username is already taken",
      EMAIL_TAKEN: "Email is already registered",
      INVALID_EMAIL: "Invalid email format",
      INVALID_USERNAME: "Username contains invalid characters",
      INVALID_PASSWORD: "Password contains invalid characters",
      INVALID_PINCODE: "Pincode contains invalid characters",
    },

    FORGOT_PASSWORD: {
      INVALID_REQ: "Invalid password reset request",
      PINCODE_MISMATCHED: "Incorrect pincode",
      PASSWORD_MISMATCHED_NEW: "New passwords do not match",
      SUCCESS: (userid) => `Password reset successful for ${userid}`,
    },

    /* -------------------------
       Account
    -------------------------- */

    ACCOUNT: {
      EMAIL_MISMATCH: "Email confirmation does not match",
      EMAIL_UPDATED: "Email updated successfully",
      PINCODE_CHANGED: "Pincode updated successfully",
    },

    /* -------------------------
       Admin Downloads
    -------------------------- */

    ADMIN_DOWNLOAD: {
      CREATE_SUCCESS: "Download entry created successfully",
      UPDATE_SUCCESS: "Download entry updated successfully",
      INVALID_BODY: "Invalid download data",
      NOT_FOUND: "Download entry not found",
    },

    /* -------------------------
       Admin News
    -------------------------- */

    ADMIN_NEWS: {
      CREATE_SUCCESS: "News post created successfully",
      UPDATE_SUCCESS: "News post updated successfully",
      INVALID_BODY: "Invalid news data",
      NOT_FOUND: "News post not found",
    },

    /* -------------------------
       Shop
    -------------------------- */

    SHOP: {
      CATEGORY_LOAD_FAILED: "Failed to load shop categories",
      ITEM_LOAD_FAILED: "Failed to load shop items",
      LOAD_FAILED: "Failed to load shop data",

      INVALID_CATEGORY: "Invalid shop category",
      INVALID_PRODUCT: "Invalid product identifier",

      ITEM_NOT_FOUND: "Shop item not found",
      OUT_OF_STOCK: "Item is out of stock",
      INSUFFICIENT_FUNDS: "Insufficient balance to purchase this item",

      PURCHASE_SUCCESS: "Purchase completed successfully",
    },

    /* -------------------------
       Ticket System
    -------------------------- */

    TICKET: {
      CREATED: "Ticket created successfully",
      REPLY_ADDED: "Reply added successfully",

      NOT_FOUND: "Ticket not found",
      INVALID_STATUS: "Invalid ticket status",
      INVALID_CATEGORY: "Invalid ticket category",
      INVALID_PRIORITY: "Invalid ticket priority",

      NO_PERMISSION: "You do not have permission to access this ticket",
      ALREADY_CLOSED: "This ticket is already closed",

      STATUS_UPDATED: "Ticket status updated successfully",
      ASSIGNED: "Ticket assigned successfully",

      CATEGORY_LOAD_FAILED: "Failed to load ticket categories",
      STAFF_LIST_FAILED: "Failed to load staff list",
    },

    /* -------------------------
       Topup
    -------------------------- */

    TOPUP: {
      INVALID_REQUEST: "Invalid top-up request",
      NOT_FOUND: "Top-up code not found",
      ALREADY_USED: "This top-up code has already been used",
      EXPIRED: "This top-up code has expired",

      VALID: "Top-up code is valid",
      REDEEM_SUCCESS: "Top-up redeemed successfully",

      LIST_FAILED: "Failed to load top-up list",
      GENERATE_FAILED: "Failed to generate top-up codes",
      GENERATION_REQUESTED: "Top-up generation requested successfully",
    },

    /* -------------------------
       Character
    -------------------------- */

    CHARACTER: {
      RANKING_FAILED: "Failed to retrieve character rankings",

      INVALID_SELECTION: "Invalid selection",
      NO_CHANGE: "No changes were made",

      NOT_FOUND: "Character not found",
      MUST_BE_OFFLINE: "Character must be offline to perform this action",

      INSUFFICIENT_FUNDS: "Insufficient currency to complete this action",
      LEVEL_REQUIREMENT_NOT_MET: "Level requirement not met",
      MAX_REBORN_REACHED: "Maximum reborn count reached",

      SCHOOL_CHANGED: "Character school updated successfully",
      CLASS_CHANGED: "Character class updated successfully",
      STATS_RESET: "Character stats have been reset",

      NO_CHARACTERS: "No characters found for this account",
      FETCH_FAILED: "Failed to retrieve character data",

      SELECT_CHARACTER: "Please select a character",
      REBORN_SUCCESS: "Reborn completed successfully",
      DELETED: "Character deleted successfully",
    },

    /* -------------------------
       Rate Limiting
    -------------------------- */

    RATE_LIMIT: {
      REGISTER: "Too many registration attempts. Please try again in 15 minutes.",
    },

    /* -------------------------
       Logging (internal but centralized)
    -------------------------- */

    LOG: {
      ACTION_DOWNLOAD_CREATE: "Created download entry",
      ACTION_DOWNLOAD_UPDATE: "Updated download entry",

      ACTION_NEWS_CREATE: "Created news post",
      ACTION_NEWS_UPDATE: "Updated news post",

      ACTION_PASSWORD_CHANGE: "Password change requested",
      ACTION_PINCODE_CHANGE: "Pincode change requested",
      ACTION_EMAIL_CHANGE: "Email change requested",

      ACTION_LOGIN_SUCCESS: "User logged in",
      ACTION_LOGIN_FAILED: "Failed login attempt",
      ACTION_REGISTER_SUCCESS: "New user registered",
      ACTION_PASSWORD_RESET: "Password reset successfully",

      ACTION_TICKET_REPLY: "Added reply to ticket",
      ACTION_TICKET_STATUS_UPDATE: "Updated ticket status",
      ACTION_TICKET_ASSIGN: "Assigned ticket to staff",
    },
  },
};

/**
 * Message resolver
 * @param {string} lang
 */
export const getMessage = (lang = "en") => {
  return messages[lang] || messages.en;
};
