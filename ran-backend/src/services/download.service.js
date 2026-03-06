import { getWebPool } from "../loaders/mssql.js";

/* =====================================================
   Download Service
   NOTE:
   - Errors are thrown as Error(message)
   - Controllers map messages
===================================================== */

/**
 * List all visible downloads
 */ export async function listDownloads({ type = null } = {}) {
  const pool = await getWebPool();

  const result = await pool.request().input("type", type).query(`
      SELECT
        ID,
        Title,
        DownloadType,
        DownloadLink,
        CreatedAt,
        Visible,
        ISNULL(ClickCount, 0) AS ClickCount
      FROM DownloadLinks
      WHERE (@type IS NULL OR DownloadType = @type)
      ORDER BY
        CASE WHEN DownloadType = 'client' THEN 0 ELSE 1 END,
        CreatedAt DESC
    `);

  return result.recordset;
}

/**
 * Increment click count for a download
 */
export async function trackDownloadClick(id) {
  const pool = await getWebPool();

  const result = await pool.request().input("id", id).query(`
    UPDATE DownloadLinks
    SET ClickCount = ISNULL(ClickCount, 0) + 1
    WHERE ID = @id AND Visible = 1
  `);

  return result.rowsAffected[0] > 0;
}

/**
 * Get single download by ID
 */
export async function getDownloadById(id) {
  const pool = await getWebPool();

  const result = await pool.request().input("id", id).query(`
      SELECT
        ID,
        Title,
        DescriptionBase64,
        DownloadLink,
        DownloadType,
        CreatedAt,
        ISNULL(ClickCount, 0) AS ClickCount
      FROM DownloadLinks
      WHERE ID = @id
        AND Visible = 1
    `);

  if (result.recordset.length === 0) {
    throw new Error("DOWNLOAD_NOT_FOUND");
  }

  return result.recordset[0];
}

/**
 * List available download types
 */
export async function listDownloadTypes() {
  const pool = await getWebPool();

  const result = await pool.query(`
    SELECT DISTINCT
      DownloadType
    FROM DownloadLinks
    WHERE Visible = 1
    ORDER BY DownloadType ASC
  `);

  return result.recordset.map((r) => r.DownloadType);
}
