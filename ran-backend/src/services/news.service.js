import { getWebPool } from "../loaders/mssql.js";

/* =====================================================
   News Service
   NOTE:
   - Errors are thrown as Error with message codes
   - Controllers map messages
===================================================== */

/**
 * Get all visible news
 */
export async function listNews({ pinnedOnly = false } = {}) {
  const pool = await getWebPool();

  const result = await pool.request().input("pinnedOnly", pinnedOnly ? 1 : 0)
    .query(`
      SELECT
        ID,
        Type,
        Title,
        Author,
        BannerImg,
        BannerImg2,
        ShortDescription,
        IsPinned,
        PinPriority,
        CreatedAt
      FROM News
      WHERE Visible = 1
        AND (@pinnedOnly = 0 OR IsPinned = 1)
      ORDER BY
        IsPinned DESC,
        PinPriority ASC,
        CreatedAt DESC
    `);

  return result.recordset;
}

/**
 * Get a single news entry by ID
 */
export async function getNewsById(id) {
  const pool = await getWebPool();

  const result = await pool.request().input("id", id).query(`
      SELECT
        ID,
        Type,
        Title,
        Author,
        BannerImg,
        BannerImg2,
        ShortDescription,
        LongDescriptionBase64,
        IsPinned,
        PinPriority,
        CreatedAt,
        UpdatedAt
      FROM News
      WHERE ID = @id
        AND Visible = 1
    `);

  if (result.recordset.length === 0) {
    throw new Error("NEWS_NOT_FOUND");
  }

  return result.recordset[0];
}

/**
 * Get available news categories (Type)
 */
export async function listNewsCategories() {
  const pool = await getWebPool();

  const result = await pool.query(`
    SELECT DISTINCT
      Type
    FROM News
    WHERE Visible = 1
    ORDER BY Type ASC
  `);

  return result.recordset.map((r) => r.Type);
}
