"use client";

import { useEffect, useState } from "react";
import { fetchWithToast } from "@/lib/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw, Wallet, Activity, History } from "lucide-react";

type RechargeItem = {
    _id: string;
    type: "RECHARGE";
    amount: number;
    note?: string;
    createdAt: string;
    userId: { _id: string; name: string; email: string; businessDetails?: { companyName?: string } };
    createdBy: { _id: string; name: string; email: string };
};

type ActionItem = {
    _id: string;
    action: "USER_EDIT" | "USER_ACTIVATE" | "USER_DEACTIVATE" | "IMPERSONATE_START";
    createdAt: string;
    adminId: { _id: string; name: string; email: string };
    targetUserId?: { _id: string; name: string; email: string; role?: string };
    details?: { userName?: string; targetName?: string; targetRole?: string; fields?: string[] };
};

const ACTION_LABELS: Record<string, string> = {
    USER_EDIT: "Editó usuario",
    USER_ACTIVATE: "Activó usuario",
    USER_DEACTIVATE: "Desactivó usuario",
    IMPERSONATE_START: "Suplantó usuario",
};

export default function AdminAuditPage() {
    const [recharges, setRecharges] = useState<RechargeItem[]>([]);
    const [actions, setActions] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [rRes, aRes] = await Promise.all([
            fetchWithToast<RechargeItem[]>("/api/admin/audit?type=recharges"),
            fetchWithToast<ActionItem[]>("/api/admin/audit?type=actions"),
        ]);
        if (!rRes.error && rRes.data) setRecharges(rRes.data);
        if (!aRes.error && aRes.data) setActions(aRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <History className="h-8 w-8 text-orange-600" />
                        Historial de Admin
                    </h2>
                    <p className="text-gray-500">Recargas de saldo y acciones realizadas por administradores.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <Tabs defaultValue="recharges" className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="recharges" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        Recargas
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Acciones
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="recharges" className="space-y-4">
                    <div className="border rounded-lg bg-white overflow-hidden">
                        <div className="md:hidden divide-y">
                            {recharges.length === 0 && !loading && (
                                <div className="p-8 text-center text-gray-500 text-sm">No hay recargas registradas.</div>
                            )}
                            {recharges.map((r) => (
                                <div key={r._id} className="p-4 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm">
                                            {(r.userId as any)?.businessDetails?.companyName || (r.userId as any)?.name || "—"}
                                        </span>
                                        <span className="font-semibold text-emerald-600">+${r.amount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Por {(r.createdBy as any)?.name || "Admin"} · {new Date(r.createdAt).toLocaleString()}
                                    </p>
                                    {r.note && <p className="text-xs text-gray-400">{r.note}</p>}
                                </div>
                            ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Negocio</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Nota</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recharges.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                                No hay recargas registradas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {recharges.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell className="text-gray-600 text-sm">
                                                {new Date(r.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">
                                                    {(r.userId as any)?.businessDetails?.companyName || (r.userId as any)?.name || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {(r.createdBy as any)?.name || "—"}
                                            </TableCell>
                                            <TableCell className="font-semibold text-emerald-600">
                                                +${r.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                                                {r.note || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                    <div className="border rounded-lg bg-white overflow-hidden">
                        <div className="md:hidden divide-y">
                            {actions.length === 0 && !loading && (
                                <div className="p-8 text-center text-gray-500 text-sm">No hay acciones registradas.</div>
                            )}
                            {actions.map((a) => (
                                <div key={a._id} className="p-4 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm">
                                            {ACTION_LABELS[a.action] || a.action}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        {(a.adminId as any)?.name} → {(a.targetUserId as any)?.name || (a.details as any)?.userName || (a.details as any)?.targetName || "—"}
                                    </p>
                                    {a.details?.fields && (
                                        <p className="text-xs text-gray-400">Campos: {a.details.fields.join(", ")}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Admin</TableHead>
                                        <TableHead>Usuario afectado</TableHead>
                                        <TableHead>Detalles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actions.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                                No hay acciones registradas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {actions.map((a) => (
                                        <TableRow key={a._id}>
                                            <TableCell className="text-gray-600 text-sm">
                                                {new Date(a.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">
                                                    {ACTION_LABELS[a.action] || a.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {(a.adminId as any)?.name || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {(a.targetUserId as any)?.name || (a.details as any)?.userName || (a.details as any)?.targetName || "—"}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm max-w-[200px]">
                                                {a.details?.fields ? `Campos: ${a.details.fields.join(", ")}` : a.details?.targetRole || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
