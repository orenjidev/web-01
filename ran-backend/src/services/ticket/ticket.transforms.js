/**
 * Transform flat SQL rows (from a JOIN with TicketReplies + TicketAttachments)
 * into a nested structure: reply → attachments[].
 */
export function groupRepliesWithAttachments(rows) {
  const repliesMap = {};

  for (const row of rows) {
    if (!repliesMap[row.ReplyID]) {
      repliesMap[row.ReplyID] = {
        ReplyID: row.ReplyID,
        UserNum: row.UserNum,
        Message: row.Message,
        IsStaffReply: row.IsStaffReply,
        CreatedAt: row.CreatedAt,
        ReplyUserID: row.ReplyUserID ?? null,
        attachments: [],
      };
    }

    if (row.AttachmentID) {
      repliesMap[row.ReplyID].attachments.push({
        AttachmentID: row.AttachmentID,
        FileName: row.FileName,
        FilePath: row.FilePath,
        FileSize: row.FileSize,
        FileType: row.FileType,
      });
    }
  }

  return Object.values(repliesMap);
}
