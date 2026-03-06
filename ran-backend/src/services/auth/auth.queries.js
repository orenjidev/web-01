/** Raw DB query functions for the auth domain. Each accepts a pool and returns raw result. */

export async function queryUserByUserId(pool, userid) {
  const result = await pool.request().input("UserID", userid).query(`
    SELECT TOP 1
      UserNum, UserID, UserPass, UserPass2, UserAvailable, UserBlock, UserType
    FROM dbo.UserInfo
    WHERE UserID = @UserID
  `);
  return result.recordset[0] ?? null;
}

export async function checkUserIdExists(pool, userid) {
  const result = await pool.request().input("UserID", userid).query(`
    SELECT TOP 1 1 FROM dbo.UserInfo WHERE UserID = @UserID
  `);
  return result.recordset.length > 0;
}

export async function checkEmailExists(pool, email) {
  const result = await pool.request().input("UserEmail", email).query(`
    SELECT TOP 1 1 FROM dbo.UserInfo WHERE UserEmail = @UserEmail
  `);
  return result.recordset.length > 0;
}

export async function insertUser(pool, { userid, encodedPass, encodedPincode, email }) {
  await pool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodedPass)
    .input("UserPass2", encodedPincode)
    .input("UserEmail", email)
    .query(`
      INSERT INTO dbo.UserInfo (UserID, UserPass, UserPass2, UserEmail)
      VALUES (@UserID, @UserPass, @UserPass2, @UserEmail)
    `);
}

export async function queryUserNumAndPincode(pool, userid) {
  const result = await pool.request().input("UserID", userid).query(`
    SELECT TOP 1 UserNum, UserPass2 FROM dbo.UserInfo WHERE UserID = @UserID
  `);
  return result.recordset[0] ?? null;
}

export async function updateUserPassword(pool, userid, encodedPass) {
  await pool
    .request()
    .input("UserID", userid)
    .input("UserPass", encodedPass)
    .query(`UPDATE dbo.UserInfo SET UserPass = @UserPass WHERE UserID = @UserID`);
}
