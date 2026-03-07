import { Router } from "express";
import { requireStaff } from "../../middlewares/auth.middleware.js";
import { getWebPool } from "../../../loaders/mssql.js";
import sql from "mssql";

const router = Router();
router.use(requireStaff);

/* GET /api/adminpanel/ticket-categories
   Returns all categories (active + inactive) */
router.get("/", async (req, res) => {
  try {
    const pool = await getWebPool();
    const result = await pool.request().query(`
      SELECT CategoryID, CategoryName, Description, DefaultAssignedTeam, IsActive, CreatedAt
      FROM dbo.TicketCategories
      ORDER BY CategoryName ASC
    `);
    return res.json({ ok: true, categories: result.recordset });
  } catch (err) {
    console.error("[TicketCategories] GET error:", err.message);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/* POST /api/adminpanel/ticket-categories
   Body: { name, description?, defaultAssignedTeam? } */
router.post("/", async (req, res) => {
  const { name, description, defaultAssignedTeam } = req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ ok: false, message: "Category name is required." });
  }

  try {
    const pool = await getWebPool();
    const result = await pool
      .request()
      .input("CategoryName", sql.NVarChar(100), name.trim())
      .input("Description", sql.NVarChar(255), description?.trim() ?? null)
      .input("DefaultAssignedTeam", sql.NVarChar(50), defaultAssignedTeam?.trim() ?? null)
      .query(`
        INSERT INTO dbo.TicketCategories (CategoryName, Description, DefaultAssignedTeam, IsActive)
        OUTPUT INSERTED.*
        VALUES (@CategoryName, @Description, @DefaultAssignedTeam, 1)
      `);
    return res.status(201).json({ ok: true, category: result.recordset[0] });
  } catch (err) {
    console.error("[TicketCategories] POST error:", err.message);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/* PATCH /api/adminpanel/ticket-categories/:id
   Body: { name?, description?, defaultAssignedTeam?, isActive? } */
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ ok: false, message: "Invalid ID." });

  const { name, description, defaultAssignedTeam, isActive } = req.body ?? {};

  try {
    const pool = await getWebPool();

    // Check exists
    const check = await pool.request().input("ID", sql.Int, id).query(
      `SELECT CategoryID FROM dbo.TicketCategories WHERE CategoryID = @ID`
    );
    if (check.recordset.length === 0) {
      return res.status(404).json({ ok: false, message: "Category not found." });
    }

    const setClauses = [];
    const req2 = pool.request().input("ID", sql.Int, id);

    if (name !== undefined) {
      req2.input("CategoryName", sql.NVarChar(100), name.trim());
      setClauses.push("CategoryName = @CategoryName");
    }
    if (description !== undefined) {
      req2.input("Description", sql.NVarChar(255), description?.trim() ?? null);
      setClauses.push("Description = @Description");
    }
    if (defaultAssignedTeam !== undefined) {
      req2.input("DefaultAssignedTeam", sql.NVarChar(50), defaultAssignedTeam?.trim() ?? null);
      setClauses.push("DefaultAssignedTeam = @DefaultAssignedTeam");
    }
    if (isActive !== undefined) {
      req2.input("IsActive", sql.Bit, isActive ? 1 : 0);
      setClauses.push("IsActive = @IsActive");
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ ok: false, message: "No fields to update." });
    }

    const result = await req2.query(`
      UPDATE dbo.TicketCategories
      SET ${setClauses.join(", ")}
      OUTPUT INSERTED.*
      WHERE CategoryID = @ID
    `);

    return res.json({ ok: true, category: result.recordset[0] });
  } catch (err) {
    console.error("[TicketCategories] PATCH error:", err.message);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

/* DELETE /api/adminpanel/ticket-categories/:id
   Soft delete: sets IsActive = 0 */
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ ok: false, message: "Invalid ID." });

  try {
    const pool = await getWebPool();

    const check = await pool.request().input("ID", sql.Int, id).query(
      `SELECT CategoryID FROM dbo.TicketCategories WHERE CategoryID = @ID`
    );
    if (check.recordset.length === 0) {
      return res.status(404).json({ ok: false, message: "Category not found." });
    }

    await pool
      .request()
      .input("ID", sql.Int, id)
      .query(`UPDATE dbo.TicketCategories SET IsActive = 0 WHERE CategoryID = @ID`);

    return res.json({ ok: true, message: "Category deactivated." });
  } catch (err) {
    console.error("[TicketCategories] DELETE error:", err.message);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
