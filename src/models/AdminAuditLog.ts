import mongoose, { Schema, Document } from "mongoose";

export type AdminActionType =
    | "USER_EDIT"
    | "USER_ACTIVATE"
    | "USER_DEACTIVATE"
    | "IMPERSONATE_START";

export interface IAdminAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: AdminActionType;
    targetUserId?: mongoose.Types.ObjectId;
    details?: Record<string, unknown>;
    createdAt: Date;
}

const AdminAuditLogSchema: Schema = new Schema(
    {
        adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        action: { type: String, enum: ["USER_EDIT", "USER_ACTIVATE", "USER_DEACTIVATE", "IMPERSONATE_START"], required: true },
        targetUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        details: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });

export default mongoose.models.AdminAuditLog || mongoose.model<IAdminAuditLog>("AdminAuditLog", AdminAuditLogSchema);
