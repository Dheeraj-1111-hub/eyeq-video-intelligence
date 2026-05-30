import AuditLog from "../models/AuditLog";

export const logAuditAction = async (
  userId: string,
  action: string,
  resourceId?: string,
  metadata?: any,
  ipAddress?: string
) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resourceId,
      metadata,
      ipAddress
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
};
