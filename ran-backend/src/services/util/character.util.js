import sql from "mssql";
import { getGamePool, getUserPool } from "../../loaders/mssql.js";
import { baseServerConfig } from "../../config/server.config.js";
import { logAction } from "../actionlog.service.js";

export const applyCharacterCost = async ({
  characterId,
  userNum,
  transactionType,
  feeOverride,
  ctx = {},
}) => {
  if (!transactionType) {
    throw new Error("TRANSACTION_TYPE_REQUIRED");
  }

  const transactionConfig = baseServerConfig[transactionType];

  if (!transactionConfig || !transactionConfig.currency) {
    throw new Error("TRANSACTION_CONFIG_NOT_FOUND");
  }

  const fee = feeOverride ?? transactionConfig.fee;
  const currency = transactionConfig.currency;

  if (fee === undefined) {
    throw new Error("TRANSACTION_FEE_NOT_DEFINED");
  }

  const gamePool = await getGamePool();
  const userPool = await getUserPool();

  const gameTx = new sql.Transaction(gamePool);
  const userTx = new sql.Transaction(userPool);

  let goldBefore = null;
  let goldAfter = null;
  let premiumBefore = null;
  let premiumAfter = null;
  let voteBefore = null;
  let voteAfter = null;

  try {
    if (currency === "gold") {
      await gameTx.begin();

      const req = new sql.Request(gameTx);
      req.input("ChaNum", characterId);

      const result = await req.query(`
        SELECT ChaMoney
        FROM RG2Game.dbo.ChaInfo WITH (UPDLOCK, ROWLOCK)
        WHERE ChaNum = @ChaNum
      `);

      if (result.recordset.length === 0) {
        throw new Error("CHARACTER_NOT_FOUND");
      }

      goldBefore = BigInt(result.recordset[0].ChaMoney);

      if (goldBefore < BigInt(fee)) {
        throw new Error("NOT_ENOUGH_GOLD");
      }

      req.input("Fee", sql.BigInt, fee);

      await req.query(`
        UPDATE RG2Game.dbo.ChaInfo
        SET ChaMoney = ChaMoney - @Fee
        WHERE ChaNum = @ChaNum
      `);

      const after = await req.query(`
        SELECT ChaMoney
        FROM RG2Game.dbo.ChaInfo
        WHERE ChaNum = @ChaNum
      `);

      goldAfter = BigInt(after.recordset[0].ChaMoney);

      await gameTx.commit();
    }

    if (currency === "premium") {
      await userTx.begin();

      const req = new sql.Request(userTx);
      req.input("UserNum", userNum);

      const result = await req.query(`
        SELECT UserPoint
        FROM dbo.UserInfo WITH (UPDLOCK, ROWLOCK)
        WHERE UserNum = @UserNum
      `);

      if (result.recordset.length === 0) {
        throw new Error("USER_NOT_FOUND");
      }

      premiumBefore = result.recordset[0].UserPoint;

      if (premiumBefore < fee) {
        throw new Error("NOT_ENOUGH_PREMIUM_POINT");
      }

      req.input("Fee", fee);

      await req.query(`
        UPDATE dbo.UserInfo
        SET UserPoint = UserPoint - @Fee
        WHERE UserNum = @UserNum
      `);

      const after = await req.query(`
        SELECT UserPoint
        FROM dbo.UserInfo
        WHERE UserNum = @UserNum
      `);

      premiumAfter = after.recordset[0].UserPoint;

      await userTx.commit();
    }

    if (currency === "vote") {
      await userTx.begin();

      const req = new sql.Request(userTx);
      req.input("UserNum", userNum);

      const result = await req.query(`
        SELECT UserPoint2
        FROM dbo.UserInfo WITH (UPDLOCK, ROWLOCK)
        WHERE UserNum = @UserNum
      `);

      if (result.recordset.length === 0) {
        throw new Error("USER_NOT_FOUND");
      }

      voteBefore = result.recordset[0].UserPoint2;

      if (voteBefore < fee) {
        throw new Error("NOT_ENOUGH_VOTE_POINT");
      }

      req.input("Fee", fee);

      await req.query(`
        UPDATE dbo.UserInfo
        SET UserPoint2 = UserPoint2 - @Fee
        WHERE UserNum = @UserNum
      `);

      const after = await req.query(`
        SELECT UserPoint2
        FROM dbo.UserInfo
        WHERE UserNum = @UserNum
      `);

      voteAfter = after.recordset[0].UserPoint2;

      await userTx.commit();
    }

    await logAction({
      userId: userNum,
      actionType: "CHARACTER COST",
      entityType: "CHARACTER",
      entityId: characterId,
      description: `Cost applied for ${transactionType}`,
      metadata: {
        transactionType,
        characterId,
        fee,
        currency,
        goldBefore: goldBefore?.toString() ?? null,
        goldAfter: goldAfter?.toString() ?? null,
        premiumBefore,
        premiumAfter,
        voteBefore,
        voteAfter,
      },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      success: true,
    });

    return true;
  } catch (err) {
    if (gameTx._aborted !== true) {
      try {
        await gameTx.rollback();
      } catch {}
    }

    if (userTx._aborted !== true) {
      try {
        await userTx.rollback();
      } catch {}
    }

    throw err;
  }
};
