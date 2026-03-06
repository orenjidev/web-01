import sql from "mssql";
import { getShopPool, getUserPool } from "../loaders/mssql.js";
import { logAction } from "../services/actionlog.service.js";

/* =====================================================
   Cart Purchase Transaction (Batch)
===================================================== */

export const purchaseCartTx = async ({ items, ctx }) => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Error("INVALID_CART");
  }

  for (const entry of items) {
    if (!entry.productNum || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 99) {
      throw new Error("INVALID_CART");
    }
  }

  const shopPool = await getShopPool();
  const userPool = await getUserPool();

  const shopTx = new sql.Transaction(shopPool);
  const userTx = new sql.Transaction(userPool);

  try {
    await shopTx.begin();
    await userTx.begin();

    /* 1. Lock & fetch all items */
    const fetchedItems = [];
    for (const entry of items) {
      const req = new sql.Request(shopTx);
      req.input("ProductNum", sql.Int, entry.productNum);

      const result = await req.query(`
        SELECT *
        FROM dbo.ShopItemMap WITH (UPDLOCK, ROWLOCK)
        WHERE ProductNum = @ProductNum
          AND ItemMoney > 0
      `);

      if (result.recordset.length === 0) {
        throw new Error("ITEM_NOT_FOUND");
      }

      const item = result.recordset[0];

      if (item.ItemStock < entry.quantity) {
        throw new Error("OUT_OF_STOCK");
      }

      fetchedItems.push({ ...item, quantity: entry.quantity });
    }

    /* 2. Compute totals per currency */
    let totalPoint1 = 0;
    let totalPoint2 = 0;

    for (const item of fetchedItems) {
      const cost = item.ItemMoney * item.quantity;
      if (item.ShopType === 1) totalPoint1 += cost;
      else totalPoint2 += cost;
    }

    /* 3. Lock & fetch user balance */
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

    if (totalPoint1 > 0 && user.UserPoint < totalPoint1) {
      throw new Error("NOT_ENOUGH_POINT");
    }
    if (totalPoint2 > 0 && user.UserPoint2 < totalPoint2) {
      throw new Error("NOT_ENOUGH_POINT2");
    }

    /* 4. Deduct currencies */
    if (totalPoint1 > 0) {
      const deductReq1 = new sql.Request(userTx);
      deductReq1.input("UserNum", sql.Int, ctx.userNum);
      deductReq1.input("Cost", sql.Int, totalPoint1);
      await deductReq1.query(`
        UPDATE dbo.UserInfo
        SET UserPoint = UserPoint - @Cost
        WHERE UserNum = @UserNum
      `);
    }
    if (totalPoint2 > 0) {
      const deductReq2 = new sql.Request(userTx);
      deductReq2.input("UserNum", sql.Int, ctx.userNum);
      deductReq2.input("Cost", sql.Int, totalPoint2);
      await deductReq2.query(`
        UPDATE dbo.UserInfo
        SET UserPoint2 = UserPoint2 - @Cost
        WHERE UserNum = @UserNum
      `);
    }

    /* 5. Process each item: decrement stock + insert purchase records */
    for (const item of fetchedItems) {
      // Decrement stock
      const stockReq = new sql.Request(shopTx);
      stockReq.input("ProductNum", sql.Int, item.ProductNum);
      stockReq.input("Qty", sql.Int, item.quantity);
      const stockResult = await stockReq.query(`
        UPDATE dbo.ShopItemMap
        SET ItemStock = ItemStock - @Qty
        WHERE ProductNum = @ProductNum
          AND ItemStock >= @Qty;
        SELECT @@ROWCOUNT AS Affected;
      `);

      if ((stockResult.recordset?.[0]?.Affected ?? 0) === 0) {
        throw new Error("OUT_OF_STOCK");
      }

      // Insert purchase records (one per unit, matching existing format)
      for (let i = 0; i < item.quantity; i++) {
        const purReq = new sql.Request(shopTx);
        purReq.input("UserUID", sql.VarChar, ctx.userid);
        purReq.input("ProductNum", sql.Int, item.ProductNum);
        purReq.input("ItemMain", sql.Int, item.ItemMain);
        purReq.input("ItemSub", sql.Int, item.ItemSub);
        purReq.input("ItemMoney", sql.Int, item.ItemMoney);

        await purReq.query(`
          INSERT INTO dbo.ShopPurchase
            (UserUID, ProductNum, PurFlag, ItemMain, ItemSub, PurChgDate)
          VALUES
            (@UserUID, @ProductNum, 0, @ItemMain, @ItemSub, GETUTCDATE())
        `);

        await purReq.query(`
          INSERT INTO dbo.ShopPurchaseLog
            (ProductNum, ItemMain, ItemSub, ItemMoney, UserID, Date)
          VALUES
            (@ProductNum, @ItemMain, @ItemSub, @ItemMoney, @UserUID, GETUTCDATE())
        `);
      }
    }

    await shopTx.commit();
    await userTx.commit();

    /* 6. Audit log (post-commit) */
    await logAction({
      userId: ctx.userNum,
      actionType: "SHOP_CART_PURCHASE",
      entityType: "SHOP",
      entityId: null,
      description: `Cart purchase: ${fetchedItems.map((i) => `${i.ItemMain}:${i.ItemSub} x${i.quantity}`).join(", ")}`,
      metadata: {
        items: fetchedItems.map((i) => ({
          productNum: i.ProductNum,
          itemMain: i.ItemMain,
          itemSub: i.ItemSub,
          cost: i.ItemMoney,
          quantity: i.quantity,
        })),
        totalPoint1,
        totalPoint2,
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
    // Whitelist-validated — never derived from user input
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

    userReq.input("Cost", sql.Int, cost);
    await userReq.query(`
      UPDATE dbo.UserInfo
      SET ${currencyField} = ${currencyField} - @Cost
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
        (@UserUID, @ProductNum, 0, @ItemMain, @ItemSub, GETUTCDATE())
    `);

    await shopReq.query(`
      INSERT INTO dbo.ShopPurchaseLog
        (ProductNum, ItemMain, ItemSub, ItemMoney, UserID, Date)
      VALUES
        (@ProductNum, @ItemMain, @ItemSub, @ItemMoney, @UserUID, GETUTCDATE())
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
