import sql from "mssql";
import {
  getUserPool,
  getGamePool,
  getShopPool,
} from "../../../loaders/mssql.js";
import { getMessage } from "../../../constants/messages.js";

/* =====================================================
   USER SEARCH & LIST
   Legacy:
   - SearchUserNum
   - SearchUserID
   - SearchUserType
   - SearchUserEmail
   - SearchUserPCID
   - GetAllUser
===================================================== */

export const searchUsers = async (query, ctx = {}) => {
  const pool = await getUserPool();
  const { q = "", by = "all", limit = 50 } = query;

  let where = "1=1";
  let param = null;

  switch (by) {
    case "userNum":
      where = "UserNum LIKE '%' + @Q + '%'";
      param = sql.NVarChar(50);
      break;
    case "userId":
      where = "UserID LIKE '%' + @Q + '%'";
      param = sql.NVarChar(255);
      break;
    case "email":
      where = "UserEmail LIKE '%' + @Q + '%'";
      param = sql.NVarChar(255);
      break;
    case "pcid":
      where = "UserPCID LIKE '%' + @Q + '%'";
      param = sql.NVarChar(255);
      break;
    case "type":
      where = "UserType = @Q";
      param = sql.Int;
      break;
  }

  const req = pool.request();

  if (param) {
    req.input("Q", param, q);
  }

  const result = await req.query(`
    SELECT TOP (${Math.min(Number(limit), 200)})
      UserNum,
      UserID,
      UserEmail,
      UserType,
      UserLoginState,
      UserAvailable,
      UserBlock,
      UserPCID
    FROM UserInfo
    WHERE ${where}
    ORDER BY UserNum DESC
  `);

  return { ok: true, rows: result.recordset };
};

/* =====================================================
   USER EXISTENCE
   Legacy: CheckExistUserID
===================================================== */

export const checkUserIdExists = async (userId) => {
  const pool = await getUserPool();

  const result = await pool
    .request()
    .input("UserID", sql.NVarChar(255), userId)
    .query(`SELECT UserNum FROM UserInfo WHERE UserID = @UserID`);

  return result.recordset.length > 0 ? result.recordset[0].UserNum : 0;
};

/* =====================================================
   USER CREATE
   Legacy: UserInfoNew
===================================================== */

export const createUser = async (body, ctx = {}) => {
  const MSG = getMessage(ctx.lang);
  const pool = await getUserPool();

  const { userId, pass, pass2, email, userType, chaRemain, userPoint } = body;

  await pool
    .request()
    .input("UserID", sql.NVarChar(255), userId)
    .input("UserPass", sql.NVarChar(255), pass)
    .input("UserPass2", sql.NVarChar(255), pass2)
    .input("UserEmail", sql.NVarChar(255), email)
    .input("UserType", sql.Int, userType)
    .input("ChaRemain", sql.Int, chaRemain)
    .input("ChaTestRemain", sql.Int, chaRemain)
    .input("UserPoint", sql.Int, userPoint).query(`
      INSERT INTO UserInfo
        (UserID, UserPass, UserPass2, UserEmail, UserType, ChaRemain, ChaTestRemain, UserPoint)
      VALUES
        (@UserID, @UserPass, @UserPass2, @UserEmail, @UserType, @ChaRemain, @ChaTestRemain, @UserPoint)
    `);

  return { ok: true, message: MSG.GENERAL.SUCCESS };
};

/* =====================================================
   USER GET
   Legacy: GetUserInfo
===================================================== */

export const getUser = async (userNum) => {
  const pool = await getUserPool();

  const result = await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .query(`SELECT * FROM UserInfo WITH (NOLOCK) WHERE UserNum = @UserNum`);

  if (result.recordset.length === 0) {
    return { ok: false };
  }

  return { ok: true, user: result.recordset[0] };
};

/* =====================================================
   USER SAVE
   Legacy: SaveUserInfo
===================================================== */

export const saveUser = async (userNum, data, ctx = {}) => {
  const MSG = getMessage(ctx.lang);
  const pool = await getUserPool();

  await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .input("UserPass", sql.NVarChar(255), data.userPass)
    .input("UserPass2", sql.NVarChar(255), data.userPass2)
    .input("UserEmail", sql.NVarChar(255), data.userEmail)
    .input("UserType", sql.Int, data.userType)
    .input("UserLoginState", sql.Bit, data.userLoginState)
    .input("UserAvailable", sql.Bit, data.userAvailable)
    .input("ChaRemain", sql.Int, data.chaRemain)
    .input("UserPoint", sql.Int, data.userPoint)
    .input("ReferralPer", sql.Int, data.referralPer)
    .input("ReferralUser", sql.Int, data.referralUser)
    .input("UserBlock", sql.Bit, data.userBlock)
    .input("UserBlockDate", sql.DateTime, data.userBlockDate)
    .input("ChatBlockDate", sql.DateTime, data.chatBlockDate)
    .input("PremiumDate", sql.DateTime, data.premiumDate).query(`
      UPDATE UserInfo SET
        UserPass = @UserPass,
        UserPass2 = @UserPass2,
        UserEmail = @UserEmail,
        UserType = @UserType,
        UserLoginState = @UserLoginState,
        UserAvailable = @UserAvailable,
        ChaRemain = @ChaRemain,
        UserPoint = @UserPoint,
        ReferralPer = @ReferralPer,
        ReferralUser = @ReferralUser,
        UserBlock = @UserBlock,
        UserBlockDate = @UserBlockDate,
        ChatBlockDate = @ChatBlockDate,
        PremiumDate = @PremiumDate
      WHERE UserNum = @UserNum
    `);

  return { ok: true, message: MSG.GENERAL.SUCCESS };
};

/* =====================================================
   LOGIN LOGS
   Legacy:
   - GetUserLoginLog
   - UserClearLoginLog
===================================================== */

export const getLoginLogs = async (userNum) => {
  const pool = await getUserPool();

  const result = await pool.request().input("UserNum", sql.Int, userNum).query(`
      SELECT LogDate, LogIpAddress, LogPCID
      FROM LogLogin
      WHERE UserNum = @UserNum AND LogInOut = 1
      ORDER BY LogDate DESC
    `);

  return { ok: true, rows: result.recordset };
};

export const clearLoginLogs = async (userNum, ctx = {}) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .query(`DELETE FROM LogLogin WHERE UserNum = @UserNum`);

  return { ok: true };
};

/* =====================================================
   CHARACTERS
   Legacy: GetUserChar
===================================================== */

export const getUserCharacters = async (userNum) => {
  const pool = await getGamePool();

  const result = await pool.request().input("UserNum", sql.Int, userNum).query(`
      SELECT ChaNum, ChaName, ChaClass, ChaSchool, ChaLevel, ChaDeleted
      FROM ChaInfo WITH (NOLOCK)
      WHERE UserNum = @UserNum
      ORDER BY ChaNum
    `);

  return { ok: true, rows: result.recordset };
};

/* =====================================================
   USER BLOCKS
   Legacy:
   - UserSetBlock
   - UserSetChatBlock
   - UserSetOffline
===================================================== */

export const setUserBlock = async (userNum, until, ctx = {}) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .input("Date", sql.DateTime, until).query(`
      UPDATE UserInfo
      SET UserBlock = 1, UserBlockDate = @Date
      WHERE UserNum = @UserNum
    `);

  return { ok: true };
};

export const setChatBlock = async (userNum, until, ctx = {}) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .input("Date", sql.DateTime, until).query(`
      UPDATE UserInfo
      SET ChatBlockDate = @Date
      WHERE UserNum = @UserNum
    `);

  return { ok: true };
};

export const forceOffline = async (userNum, ctx = {}) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .query(`UPDATE UserInfo SET UserLoginState = 0 WHERE UserNum = @UserNum`);

  return { ok: true };
};

/* =====================================================
   BANK
   Legacy:
   - GetUserBank
   - UserBankClear
   - UserBankSetTaken
   - UserBankInsert
===================================================== */

export const getUserBank = async (userId, taken = false) => {
  const pool = await getShopPool();

  const flag = taken ? 1 : 0;
  const result = await pool
    .request()
    .input("UserUID", sql.NVarChar(255), userId).query(`
      SELECT PurKey, ProductNum
      FROM ShopPurchase
      WHERE UserUID = @UserUID AND PurFlag = ${flag}
    `);

  return { ok: true, rows: result.recordset };
};

export const clearUserBank = async (userId, ctx = {}) => {
  const pool = await getShopPool();

  await pool
    .request()
    .input("UserUID", sql.NVarChar(255), userId)
    .query(`UPDATE ShopPurchase SET PurFlag = 1 WHERE UserUID = @UserUID`);

  return { ok: true };
};

export const setBankTaken = async (purKey, ctx = {}) => {
  const pool = await getShopPool();

  await pool
    .request()
    .input("PurKey", sql.NVarChar(255), purKey)
    .query(`UPDATE ShopPurchase SET PurFlag = 1 WHERE PurKey = @PurKey`);

  return { ok: true };
};

export const insertBankItem = async (userId, productNum, mainId, subId) => {
  const pool = await getShopPool();

  await pool
    .request()
    .input("UserUID", sql.NVarChar(255), userId)
    .input("ProductNum", sql.Int, productNum)
    .input("ItemMain", sql.Int, mainId)
    .input("ItemSub", sql.Int, subId).query(`
      INSERT INTO ShopPurchase
        (UserUID, ProductNum, PurFlag, PurDate, PurChgDate, ItemMain, ItemSub)
      VALUES
        (@UserUID, @ProductNum, 0, GETDATE(), GETDATE(), @ItemMain, @ItemSub)
    `);

  return { ok: true };
};

/* =====================================================
   TOPUP
   Legacy:
   - GetTopUpAll
   - TopUpGenerate
   - TopUpSetUse
===================================================== */

export const listTopups = async () => {
  const pool = await getUserPool();

  const result = await pool.request().query(`
    SELECT idx, ECode, EPin, EValue, GenDate
    FROM TopUp
    WHERE Used = 0
  `);

  return { ok: true, rows: result.recordset };
};

export const generateTopups = async (count, value) => {
  const pool = await getUserPool();

  const result = await pool
    .request()
    .input("nCount", count)
    .input("nValue", value)
    .output("nReturn")
    .execute("TopUpGenerate");

  return { ok: true, generated: result.output.nReturn };
};

export const setTopupUsed = async (idx) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("Idx", sql.Int, idx)
    .query(`UPDATE TopUp SET Used = 1, UseDate = GETDATE() WHERE idx = @Idx`);

  return { ok: true };
};

/* =====================================================
   REFERRAL
   Legacy: UserReferralGet
===================================================== */

export const getUserReferrals = async (userNum) => {
  const pool = await getUserPool();

  const result = await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .execute("dbo.sp_GetReferral");

  return { ok: true, rows: result.recordset };
};

/* =====================================================
   PCID BLOCK
   Legacy:
   - GetPCID
   - PCIDBlockInsert
   - PCIDBlockDelete
===================================================== */

export const listPcidBlocks = async () => {
  const pool = await getUserPool();

  const result = await pool.request().query(`
    SELECT BlockIdx, BlockPCID, BlockTYPE, BlockReason, BlockDate
    FROM BlockPCID
  `);

  return { ok: true, rows: result.recordset };
};

export const insertPcidBlock = async (pcid, reason, ctx = {}) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("PCID", sql.NVarChar(255), pcid)
    .input("Reason", sql.NVarChar(255), reason).query(`
      INSERT INTO BlockPCID
        (BlockPCID, BlockTYPE, BlockReason, BlockDate)
      VALUES
        (@PCID, 0, @Reason, GETDATE())
    `);

  return { ok: true };
};

export const deletePcidBlock = async (idx, ctx = {}) => {
  const pool = await getUserPool();

  await pool
    .request()
    .input("Idx", sql.Int, idx)
    .query(`DELETE FROM BlockPCID WHERE BlockIdx = @Idx`);

  return { ok: true };
};
