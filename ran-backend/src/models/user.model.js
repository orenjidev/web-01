import { getUserPool } from "../loaders/mssql.js";

export const findUserByUserId = async (userId) => {
  const pool = await getUserPool();

  // Parameterized query (prevents SQL injection)
  const result = await pool.request().input("UserID", userId).query(`
      SELECT TOP 1
        UserNum,
        UserID,
        UserPass,
        UserType,
        UserBlock,
        UserAvailable,
        LastLoginDate,
        UserPoint,
        UserEmail
      FROM dbo.UserInfo
      WHERE UserID = @UserID
    `);

  return result.recordset?.[0] ?? null;
};

// This needs to be move in Web Database
export const updateLastLogin = async (userNum) => {
  const pool = await getUserPool();

  await pool.request().input("UserNum", userNum).query(`
      UPDATE dbo.UserInfo
      SET LastLoginDate = GETDATE()
      WHERE UserNum = @UserNum
    `);
};
