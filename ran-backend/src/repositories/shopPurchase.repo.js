import sql from "mssql";
import { getShopPool, getUserPool } from "../loaders/mssql.js";
import { logAction } from "../services/actionlog.service.js";

/* =====================================================
   Shop Purchase Transaction
   NOTE:
   - Errors are thrown as strings
   - Caller is responsible for mapping messages
   - Function signature must not change
===================================================== */

export const purchaseShopItemTx = async ({ productNum, ctx }) => {
  const shopPool = await getShopPool();
  const userPool = await getUserPool();

  const shopTx = new sql.Transaction(shopPool);
  const userTx = new sql.Transaction(userPool);

  try {
    await shopTx.begin();
    await userTx.begin();

    /* ---------------------------------
       1. Lock & fetch item
    ---------------------------------- */

    const shopReq = new sql.Request(shopTx);
    shopReq.input("ProductNum", sql.Int, productNum);

    const itemResult = await shopReq.query(`
      SELECT *
      FROM dbo.ShopItemMap WITH (UPDLOCK, ROWLOCK)
      WHERE ProductNum = @ProductNum
        AND ItemMoney > 0
    `);

    if (itemResult.recordset.length === 0) {
      throw new Error("ITEM_NOT_FOUND");
    }

    const item = itemResult.recordset[0];

    if (item.ItemStock <= 0) {
      throw new Error("OUT_OF_STOCK");
    }

    /* ---------------------------------
       2. Lock & fetch user balance
    ---------------------------------- */

    const userReq = new sql.Request(userTx);
    userReq.input("UserNum", sql.Int, ctx.userNum);

    const userResult = await userReq.query(`
      SELECT UserPoint, UserPoint2
      FROM dbo.UserInfo WITH (UPDLOCK, ROWLOCK)
      WHERE UserNum = @UserNum
    `);

    if (userResult.recordset.length === 0) {
      throw new Error("USER_NOT_FOUND");
    }

    const user = userResult.recordset[0];
    const cost = item.ItemMoney;

    const isPoint1 = item.ShopType === 1;
    const currencyField = isPoint1 ? "UserPoint" : "UserPoint2";
    const beforeBalance = isPoint1 ? user.UserPoint : user.UserPoint2;

    if (isPoint1 && user.UserPoint < cost) {
      throw new Error("NOT_ENOUGH_POINT");
    }

    if (!isPoint1 && user.UserPoint2 < cost) {
      throw new Error("NOT_ENOUGH_POINT2");
    }

    /* ---------------------------------
       3. Deduct user currency
    ---------------------------------- */

    await userReq.query(`
      UPDATE dbo.UserInfo
      SET ${currencyField} = ${currencyField} - ${cost}
      WHERE UserNum = @UserNum
    `);

    /* ---------------------------------
       4. Decrease stock if limited
    ---------------------------------- */

    const stockResult = await shopReq.query(`
      UPDATE dbo.ShopItemMap
      SET ItemStock = ItemStock - 1
      WHERE ProductNum = @ProductNum
        AND ItemStock > 0;

      SELECT @@ROWCOUNT AS Affected;
    `);

    const affected = stockResult.recordset?.[0]?.Affected ?? 0;

    if (affected === 0) {
      throw new Error("OUT_OF_STOCK");
    }

    /* ---------------------------------
       5. Insert purchase records
    ---------------------------------- */

    shopReq.input("UserUID", sql.VarChar, ctx.userid);
    shopReq.input("ItemMain", sql.Int, item.ItemMain);
    shopReq.input("ItemSub", sql.Int, item.ItemSub);
    shopReq.input("ItemMoney", sql.Int, cost);

    await shopReq.query(`
      INSERT INTO dbo.ShopPurchase
        (UserUID, ProductNum, PurFlag, ItemMain, ItemSub, PurChgDate)
      VALUES
        (@UserUID, @ProductNum, 0, @ItemMain, @ItemSub, GETDATE())
    `);

    await shopReq.query(`
      INSERT INTO dbo.ShopPurchaseLog
        (ProductNum, ItemMain, ItemSub, ItemMoney, UserID)
      VALUES
        (@ProductNum, @ItemMain, @ItemSub, @ItemMoney, @UserUID)
    `);

    /* ---------------------------------
       6. Fetch balance after purchase
    ---------------------------------- */

    const afterResult = await userReq.query(`
      SELECT UserPoint, UserPoint2
      FROM dbo.UserInfo
      WHERE UserNum = @UserNum
    `);

    const afterBalance = isPoint1
      ? afterResult.recordset[0].UserPoint
      : afterResult.recordset[0].UserPoint2;

    await shopTx.commit();
    await userTx.commit();

    /* ---------------------------------
       7. Audit log (post-commit)
    ---------------------------------- */

    await logAction({
      userId: ctx.userNum,
      actionType: "SHOP_PURCHASE",
      entityType: "SHOP",
      entityId: productNum,
      description: `Purchased item ${item.ItemMain}:${item.ItemSub}`,
      metadata: {
        productNum,
        itemMain: item.ItemMain,
        itemSub: item.ItemSub,
        cost,
        currency: currencyField,
        beforeBalance,
        afterBalance,
        unlimited: item.IsUnli === 1,
      },
      ipAddress: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
      success: true,
    });

    return true;
  } catch (err) {
    try {
      await shopTx.rollback();
      await userTx.rollback();
    } catch (_) {
      // swallow rollback errors
    }
    throw err;
  }
};
