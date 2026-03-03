import { getUserPool } from "../loaders/mssql.js";
import { logAction } from "./actionlog.service.js";
import sql from "mssql";

/* =====================================================
   Top-up Service
   NOTE:
   - Errors are intentionally thrown as strings
   - Controllers are responsible for mapping messages
   - Do NOT change function signatures (routes depend on them)
===================================================== */

/**
 * Check top-up code validity
 */
export const listUserTopups = async (userNum) => {
  const pool = await getUserPool();

  const result = await pool.request().input("UserNum", sql.BigInt, userNum)
    .query(`
      SELECT
        ECode,
        EValue,
        UseDate
      FROM TopUpLog
      WHERE UserNum = @UserNum
      ORDER BY UseDate DESC
    `);

  return result.recordset.map((row) => ({
    code: row.ECode,
    value: Number(row.EValue),
    usedAt: row.UseDate,
  }));
};

export async function checkTopup(code, pin) {
  const pool = await getUserPool();

  const result = await pool.request().input("code", code).input("pin", pin)
    .query(`
      SELECT
        EValue,
        Used
      FROM TopUp
      WHERE ECode = @code
        AND EPin = @pin
    `);

  if (result.recordset.length === 0) {
    throw new Error("INVALID_CODE");
  }

  const topup = result.recordset[0];

  if (topup.Used === 1) {
    throw new Error("CODE_ALREADY_USED");
  }

  return {
    value: topup.EValue,
  };
}

/**
 * Redeem a top-up code and apply value to user account
 */
export async function redeemTopup(code, pin, userNum, ctx = {}) {
  const pool = await getUserPool();

  try {
    const result = await pool
      .request()
      .input("nUserDbNum", userNum)
      .input("ECode", code)
      .input("EPin", pin)
      .output("nReturn", sql.Int)
      .execute("sp_PremiumPointTopUp");

    const returnValue = result.output.nReturn;

    /* ---------------------------------
       Handle SP Return Codes
    ---------------------------------- */

    if (returnValue === -1) {
      throw new Error("USER_NOT_FOUND");
    }

    if (returnValue === -2) {
      throw new Error("INVALID_OR_USED_CODE");
    }

    const newBalance = returnValue;

    /* ---------------------------------
       Log Success
    ---------------------------------- */

    await logAction({
      userId: userNum,
      actionType: "TOPUP_REDEEM",
      entityType: "ACCOUNT",
      entityId: userNum,
      description: `Top-up redeemed via SP`,
      metadata: {
        code,
        newBalance,
      },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      success: true,
    });

    return { newBalance };
  } catch (err) {
    /* ---------------------------------
       Log Failure
    ---------------------------------- */

    await logAction({
      userId: userNum,
      actionType: "TOPUP_REDEEM",
      entityType: "ACCOUNT",
      entityId: userNum,
      description: `Top-up redeem failed`,
      metadata: {
        code,
        reason: err.message,
      },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      success: false,
    });

    throw err;
  }
}

// OLD VERSION
// UTILIZE SP SO THAT IT IS ALIGNED INGAME
// export async function redeemTopup(code, pin, userNum, ctx = {}) {
//   const pool = await getUserPool();
//   const transaction = pool.transaction();

//   await transaction.begin();

//   try {
//     /* ---------------------------------
//        1. Mark top-up as used (atomic)
//     ---------------------------------- */

//     const updateResult = await transaction
//       .request()
//       .input("code", code)
//       .input("pin", pin)
//       .input("userNum", userNum).query(`
//         UPDATE TopUp
//         SET
//           Used = 1,
//           UseDate = GETDATE(),
//           resellerLoad = @userNum
//         WHERE ECode = @code
//           AND EPin = @pin
//           AND Used = 0
//       `);

//     if (updateResult.rowsAffected[0] === 0) {
//       throw new Error("INVALID_OR_USED_CODE");
//     }

//     /* ---------------------------------
//        2. Retrieve top-up value
//     ---------------------------------- */

//     const topupResult = await transaction
//       .request()
//       .input("code", code)
//       .input("pin", pin).query(`
//         SELECT EValue
//         FROM TopUp
//         WHERE ECode = @code
//           AND EPin = @pin
//       `);

//     const topupValue = topupResult.recordset[0].EValue;

//     /* ---------------------------------
//        3. Get user balance before
//     ---------------------------------- */

//     const beforeResult = await transaction.request().input("userNum", userNum)
//       .query(`
//         SELECT UserPoint
//         FROM UserInfo
//         WHERE UserNum = @userNum
//       `);

//     const beforePoint = beforeResult.recordset[0].UserPoint;

//     /* ---------------------------------
//        4. Apply top-up value
//     ---------------------------------- */

//     await transaction
//       .request()
//       .input("userNum", userNum)
//       .input("value", topupValue).query(`
//         UPDATE UserInfo
//         SET UserPoint = UserPoint + @value
//         WHERE UserNum = @userNum
//       `);

//     /* ---------------------------------
//        5. Get user balance after
//     ---------------------------------- */

//     const afterResult = await transaction.request().input("userNum", userNum)
//       .query(`
//         SELECT UserPoint
//         FROM UserInfo
//         WHERE UserNum = @userNum
//       `);

//     const afterPoint = afterResult.recordset[0].UserPoint;

//     await transaction.commit();

//     /* ---------------------------------
//        6. Audit log (outside transaction)
//     ---------------------------------- */

//     await logAction({
//       userId: userNum,
//       actionType: "TOPUP_REDEEM",
//       entityType: "ACCOUNT",
//       entityId: userNum,
//       description: `Top-up redeemed: +${topupValue} EP`,
//       metadata: {
//         code,
//         topupValue,
//         beforeEP: beforePoint,
//         afterEP: afterPoint,
//       },
//       ipAddress: ctx.ip ?? null,
//       success: true,
//     });
//   } catch (err) {
//     await transaction.rollback();
//     throw err;
//   }
// }
