import sql from "mssql";
import { getGamePool } from "../../../loaders/mssql.js";

/**
 * Read-only inventory fetch
 * Legacy: ItemSelect(...)
 */
export const getCharacterItems = async ({ chaNum, invenType }) => {
  if (!chaNum || invenType == null) {
    return { ok: false, message: "INVALID_INPUT" };
  }

  const pool = await getGamePool();

  const result = await pool
    .request()
    .input("ChaNum", sql.Int, chaNum)
    .input("InvenType", sql.TinyInt, invenType)
    .execute("dbo.sp_ItemGetItemList");

  return {
    ok: true,
    items: result.recordset,
  };
};
