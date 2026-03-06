import sql from "mssql";

/** Raw DB query functions for the account domain. */

export async function verifyPincodeAndEmail(pool, userid, encodedPincode, email) {
  const result = await pool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodedPincode)
    .input("UserEmail", email)
    .query(`
      SELECT TOP 1 UserNum FROM dbo.UserInfo
      WHERE UserID = @UserID AND UserPass2 = @UserPass2 AND UserEmail = @UserEmail
    `);
  return result.recordset[0] ?? null;
}

export async function updatePincode(pool, userid, encodedNewPincode) {
  await pool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodedNewPincode)
    .query(`UPDATE dbo.UserInfo SET UserPass2 = @UserPass2 WHERE UserID = @UserID`);
}

export async function verifyPasswordAndPincode(pool, userid, encodedPassword, encodedPincode) {
  const result = await pool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodedPassword)
    .input("UserPass2", encodedPincode)
    .query(`
      SELECT TOP 1 UserNum FROM dbo.UserInfo
      WHERE UserID = @UserID AND UserPass = @UserPass AND UserPass2 = @UserPass2
    `);
  return result.recordset[0] ?? null;
}

export async function updatePassword(pool, userid, encodedNewPassword) {
  await pool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodedNewPassword)
    .query(`UPDATE dbo.UserInfo SET UserPass = @UserPass WHERE UserID = @UserID`);
}

export async function verifyPincode(pool, userid, encodedPincode) {
  const result = await pool
    .request()
    .input("UserID", userid)
    .input("UserPass2", encodedPincode)
    .query(`
      SELECT TOP 1 UserNum FROM dbo.UserInfo
      WHERE UserID = @UserID AND UserPass2 = @UserPass2
    `);
  return result.recordset[0] ?? null;
}

export async function updateEmail(pool, userid, email) {
  await pool
    .request()
    .input("UserID", userid)
    .input("UserEmail", email)
    .query(`UPDATE dbo.UserInfo SET UserEmail = @UserEmail WHERE UserID = @UserID`);
}

const ALLOWED_POINT_COLS = ["UserPoint", "UserPoint2"];

export async function atomicConvertPoints(pool, userNum, fromCol, toCol, amount, received) {
  if (!ALLOWED_POINT_COLS.includes(fromCol) || !ALLOWED_POINT_COLS.includes(toCol)) {
    throw new Error("Invalid point column");
  }
  const result = await pool
    .request()
    .input("UserNum", sql.Int, userNum)
    .input("Amount", sql.Int, amount)
    .input("Received", sql.Int, received)
    .query(`
      UPDATE dbo.UserInfo
      SET ${fromCol} = ${fromCol} - @Amount, ${toCol} = ${toCol} + @Received
      WHERE UserNum = @UserNum AND ${fromCol} >= @Amount
    `);
  return result.rowsAffected[0];
}

export async function queryAccountInfo(pool, userid) {
  const result = await pool.request().input("UserID", userid).query(`
    SELECT TOP 1
      UserID, UserType, UserAvailable, UserBlock, ChaRemain, UserEmail, UserPoint, UserPoint2
    FROM dbo.UserInfo
    WHERE UserID = @UserID
  `);
  return result.recordset[0] ?? null;
}
