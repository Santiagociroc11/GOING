import mongoose from "mongoose";
import AdminAuditLog from "@/models/AdminAuditLog";

export type AdminActionType = "USER_EDIT" | "USER_ACTIVATE" | "USER_DEACTIVATE" | "IMPERSONATE_START";

export async function logAdminAction(
    adminId: mongoose.Types.ObjectId,
    action: AdminActionType,
    targetUserId?: mongoose.Types.ObjectId,
    details?: Record<string, unknown>
): Promise<void> {
    try {
        await AdminAuditLog.create({
            adminId,
            action,
            targetUserId,
            details,
        });
    } catch (e) {
        console.error("[Audit] Error logging admin action:", e);
    }
}
