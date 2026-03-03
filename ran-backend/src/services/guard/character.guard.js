import { getGamePool, getUserPool } from "../../loaders/mssql.js";

export const getOfflineCharacterForUpdate = async (characterId, userNum) => {
  if (!characterId || !userNum) {
    throw new Error("UNAUTHORIZED");
  }

  /* =====================================================
     1. LOAD CHARACTER (GAME DB)
     - ownership
     - offline
     - not deleted
     - economy
  ===================================================== */

  const gamePool = await getGamePool();
  const gameReq = gamePool.request();

  gameReq.input("ChaNum", characterId);
  gameReq.input("UserNum", userNum);

  const charResult = await gameReq.query(`
    SELECT
      ChaNum,
      ChaMoney,
      ChaSchool,
      ChaOnline,
      ChaLevel,
      ChaReborn,
      ChaClass
    FROM RG2Game.dbo.ChaInfo
    WHERE ChaNum = @ChaNum
      AND UserNum = @UserNum
      AND ChaDeleted = 0
  `);

  if (charResult.recordset.length === 0) {
    throw new Error("USER_MISMATCH");
  }

  const { ChaMoney, ChaSchool, ChaOnline, ChaLevel, ChaReborn, ChaClass } =
    charResult.recordset[0];

  if (ChaOnline !== 0) {
    throw new Error("CHARACTER_ONLINE");
  }

  /* =====================================================
     2. LOAD USER POINTS (USER DB)
  ===================================================== */

  const userPool = await getUserPool();
  const userReq = userPool.request();

  userReq.input("UserNum", userNum);

  const userResult = await userReq.query(`
    SELECT UserPoint
    FROM dbo.UserInfo
    WHERE UserNum = @UserNum
  `);

  if (userResult.recordset.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  const { UserPoint } = userResult.recordset[0];

  /* =====================================================
     3. RETURN TRUSTED SNAPSHOT
  ===================================================== */

  return {
    character: {
      id: characterId,
      school: ChaSchool,
      money: ChaMoney,
      level: ChaLevel,
      reborn: ChaReborn,
      class: ChaClass,
    },
    user: {
      userNum,
      point: UserPoint,
    },
  };
};
