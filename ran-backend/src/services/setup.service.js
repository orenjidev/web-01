import { getWebPool } from "../loaders/mssql.js";

/**
 * SQL statements executed in order at startup.
 * Each statement is idempotent (IF NOT EXISTS guards),
 * so they are safe to run on every boot.
 */
const SETUP_STATEMENTS = [
  /* ── ActionLog ─────────────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ActionLog'
  )
  CREATE TABLE dbo.ActionLog (
    ID           INT           IDENTITY(1,1) NOT NULL,
    UserID       INT           NULL,
    ActionType   NVARCHAR(50)  NOT NULL,
    EntityType   NVARCHAR(50)  NULL,
    EntityID     NVARCHAR(100) NULL,
    Description  NVARCHAR(500) NULL,
    MetadataJson NVARCHAR(MAX) NULL,
    IPAddress    NVARCHAR(45)  NULL,
    UserAgent    NVARCHAR(512) NULL,
    Success      BIT           NOT NULL DEFAULT 1,
    CreatedAt    DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ActionLog PRIMARY KEY (ID)
  );`,

  /* ── TicketCategories ───────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TicketCategories'
  )
  CREATE TABLE dbo.TicketCategories (
    CategoryID   INT           IDENTITY(1,1) NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    IsActive     BIT           NOT NULL DEFAULT 1,
    CONSTRAINT PK_TicketCategories PRIMARY KEY (CategoryID)
  );`,

  /* Add optional columns to TicketCategories (idempotent) */
  `IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TicketCategories' AND COLUMN_NAME='Description')
    ALTER TABLE dbo.TicketCategories ADD Description NVARCHAR(255) NULL;`,

  `IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TicketCategories' AND COLUMN_NAME='DefaultAssignedTeam')
    ALTER TABLE dbo.TicketCategories ADD DefaultAssignedTeam NVARCHAR(50) NULL;`,

  `IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TicketCategories' AND COLUMN_NAME='CreatedAt')
    ALTER TABLE dbo.TicketCategories ADD CreatedAt DATETIME NOT NULL DEFAULT GETDATE();`,

  /* Seed default categories only when the table is brand-new / empty */
  `IF NOT EXISTS (SELECT 1 FROM dbo.TicketCategories)
  INSERT INTO dbo.TicketCategories (CategoryName, IsActive) VALUES
    (N'General Inquiry', 1),
    (N'Bug Report',      1),
    (N'Account Issue',   1),
    (N'Game Issue',      1),
    (N'Payment Issue',   1);`,

  /* ── Tickets ────────────────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Tickets'
  )
  CREATE TABLE dbo.Tickets (
    TicketID               INT           IDENTITY(1,1) NOT NULL,
    UserNum                INT           NOT NULL,
    CategoryID             INT           NOT NULL,
    Subject                NVARCHAR(255) NOT NULL,
    Description            NVARCHAR(MAX) NOT NULL,
    Priority               NVARCHAR(20)  NOT NULL DEFAULT 'Low',
    Status                 NVARCHAR(20)  NOT NULL DEFAULT 'Open',
    CharacterName          NVARCHAR(100) NULL,
    GameID                 NVARCHAR(100) NULL,
    AssignedToStaffUserNum INT           NULL,
    CreatedAt              DATETIME2     NOT NULL DEFAULT GETDATE(),
    UpdatedAt              DATETIME2     NOT NULL DEFAULT GETDATE(),
    ClosedAt               DATETIME2     NULL,
    CONSTRAINT PK_Tickets PRIMARY KEY (TicketID)
  );`,

  /* ── TicketReplies ──────────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TicketReplies'
  )
  CREATE TABLE dbo.TicketReplies (
    ReplyID      INT           IDENTITY(1,1) NOT NULL,
    TicketID     INT           NOT NULL,
    UserNum      INT           NOT NULL,
    Message      NVARCHAR(MAX) NOT NULL,
    IsStaffReply BIT           NOT NULL DEFAULT 0,
    CreatedAt    DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TicketReplies PRIMARY KEY (ReplyID)
  );`,

  /* ── TicketAttachments ──────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TicketAttachments'
  )
  CREATE TABLE dbo.TicketAttachments (
    AttachmentID      INT           IDENTITY(1,1) NOT NULL,
    TicketID          INT           NOT NULL,
    ReplyID           INT           NULL,
    FileName          NVARCHAR(255) NOT NULL,
    FilePath          NVARCHAR(500) NOT NULL,
    FileSize          BIGINT        NOT NULL,
    FileType          NVARCHAR(100) NOT NULL,
    UploadedByUserNum INT           NULL,
    UploadedAt        DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TicketAttachments PRIMARY KEY (AttachmentID)
  );`,

  /* ── TicketHistory ──────────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TicketHistory'
  )
  CREATE TABLE dbo.TicketHistory (
    HistoryID          INT           IDENTITY(1,1) NOT NULL,
    TicketID           INT           NOT NULL,
    ActionType         NVARCHAR(50)  NOT NULL,
    NewValue           NVARCHAR(500) NULL,
    PerformedByUserNum INT           NULL,
    PerformedAt        DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TicketHistory PRIMARY KEY (HistoryID)
  );`,

  /* ── News ───────────────────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'News'
  )
  CREATE TABLE dbo.News (
    ID                    INT           IDENTITY(1,1) NOT NULL,
    Type                  NVARCHAR(50)  NOT NULL,
    Title                 NVARCHAR(255) NOT NULL,
    Author                NVARCHAR(150) NULL,
    BannerImg             NVARCHAR(512) NULL,
    BannerImg2            NVARCHAR(512) NULL,
    ShortDescription      NVARCHAR(500) NULL,
    LongDescriptionBase64 NVARCHAR(MAX) NOT NULL,
    IsPinned              BIT           NOT NULL DEFAULT 0,
    PinPriority           INT           NOT NULL DEFAULT 0,
    Visible               BIT           NOT NULL DEFAULT 1,
    CreatedAt             DATETIME2     NOT NULL DEFAULT GETDATE(),
    UpdatedAt             DATETIME2     NULL,
    CONSTRAINT PK_News PRIMARY KEY (ID)
  );`,

  /* ── DownloadLinks ──────────────────────────────────────────── */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DownloadLinks'
  )
  CREATE TABLE dbo.DownloadLinks (
    ID                INT            IDENTITY(1,1) NOT NULL,
    Title             NVARCHAR(255)  NOT NULL,
    DescriptionBase64 NVARCHAR(MAX)  NULL,
    DownloadLink      NVARCHAR(2048) NOT NULL,
    DownloadType      NVARCHAR(50)   NOT NULL DEFAULT 'other',
    Visible           BIT            NOT NULL DEFAULT 1,
    CreatedAt         DATETIME2      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DownloadLinks PRIMARY KEY (ID)
  );`,

  /* ── DownloadLinks: add ClickCount column ──────────────────── */
  `IF COL_LENGTH('dbo.DownloadLinks', 'ClickCount') IS NULL
   ALTER TABLE dbo.DownloadLinks ADD ClickCount INT NOT NULL DEFAULT 0;`,

  /* ── ServerConfig ───────────────────────────────────────────── */
  /* Also created by serverConfig.service.js — safe to repeat (idempotent). */
  `IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ServerConfig'
  )
  CREATE TABLE dbo.ServerConfig (
    ConfigKey        NVARCHAR(100) NOT NULL,
    ConfigValue      NVARCHAR(MAX) NOT NULL,
    UpdatedAt        DATETIME2     NOT NULL DEFAULT GETDATE(),
    UpdatedByUserNum INT           NULL,
    CONSTRAINT PK_ServerConfig PRIMARY KEY (ConfigKey)
  );`,
];

/**
 * Called once at startup — creates all OrenjiWeb (WebPool) tables that
 * do not yet exist.  Every statement is guarded with IF NOT EXISTS so
 * this is completely safe to run on every boot against a populated DB.
 */
export const setupWebPoolTables = async () => {
  try {
    const pool = await getWebPool();

    for (const statement of SETUP_STATEMENTS) {
      await pool.request().query(statement);
    }

    console.log("[Setup] WebPool tables verified successfully");
  } catch (err) {
    console.error("[Setup] Failed to verify WebPool tables:", err.message);
    // Non-fatal: server still boots with whatever tables already exist
  }
};
