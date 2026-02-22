"use client";

import { useEffect, useState } from "react";
import { fetchWithToast, mutateWithToast, toast } from "@/lib/toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Bell, Building2, Truck, Send, FileText } from "lucide-react";
import type { NotificationType } from "@/models/NotificationSettings";

type PushLogEntry = {
    deliveryId: string;
    userId: string;
    type?: string;
    payload: { title: string; body?: string };
    status: string;
    errorMessage?: string;
    sentAt: string;
    receivedAt?: string;
    displayedAt?: string;
    errorAt?: string;
    user?: { name: string; email: string; role: string };
};

const NOTIFICATION_CONFIG: { key: NotificationType; label: string; description: string; role: "business" | "driver" }[] = [
    { key: "businessOrderAccepted", label: "Pedido aceptado", description: "Cuando un domiciliario toma el pedido", role: "business" },
    { key: "businessOrderPickedUp", label: "Pedido en camino", description: "Cuando el domiciliario recoge el pedido", role: "business" },
    { key: "businessOrderDelivered", label: "Pedido entregado", description: "Cuando el pedido fue entregado", role: "business" },
    { key: "businessOrderCancelled", label: "Pedido cancelado", description: "Cuando se cancela el pedido", role: "business" },
    { key: "businessRecharge", label: "Recarga de saldo", description: "Cuando el admin recarga saldo al negocio", role: "business" },
    { key: "driverNewOrder", label: "Nuevo pedido disponible", description: "Cuando un negocio crea un pedido en tu ciudad", role: "driver" },
    { key: "driverOrderCancelled", label: "Pedido cancelado", description: "Cuando se cancela un pedido que tenías asignado", role: "driver" },
];

export default function AdminNotificationsPage() {
    const [settings, setSettings] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [testUserId, setTestUserId] = useState<string>("");
    const [logsUserId, setLogsUserId] = useState<string>("__all__");
    const [users, setUsers] = useState<{ _id: string; name: string; email: string; role: string }[]>([]);
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; targetUserId?: string; logs?: string[]; error?: string; summary?: { sent: number; failed: number; total: number }; results?: { ok: boolean; error?: string; deliveryId?: string }[] } | null>(null);
    const [pushLogs, setPushLogs] = useState<PushLogEntry[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await fetchWithToast<Record<string, boolean>>("/api/admin/notification-settings");
        if (!error && data) setSettings(data ?? {});
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchWithToast<{ _id: string; name: string; email: string; role: string }[]>("/api/admin/users").then(
            ({ data }) => data && setUsers(data)
        );
    }, []);

    useEffect(() => {
        fetchPushLogs();
    }, []);

    const handleToggle = async (key: string, value: boolean) => {
        setSaving(key);
        const { data, error } = await mutateWithToast("/api/admin/notification-settings", {
            method: "PUT",
            body: { [key]: value },
        });
        setSaving(null);
        if (!error && data && typeof data === "object") setSettings(data as Record<string, boolean>);
    };

    const fetchPushLogs = async (uid?: string) => {
        setLogsLoading(true);
        const url = uid ? `/api/admin/push-logs?userId=${uid}&limit=30` : "/api/admin/push-logs?limit=30";
        const { data } = await fetchWithToast<{ logs: PushLogEntry[] }>(url);
        if (data?.logs) setPushLogs(data.logs);
        setLogsLoading(false);
    };

    const handleTestPush = async (useCurrentUser?: boolean, useMyself?: boolean) => {
        setTestLoading(true);
        setTestResult(null);
        const body = useCurrentUser
            ? { useCurrentUser: true }
            : useMyself
              ? { useMyself: true }
              : { userId: testUserId };
        if (!useCurrentUser && !useMyself && !testUserId) {
            toast.warning("Selecciona un usuario o usa 'Probar a mí mismo'");
            setTestLoading(false);
            return;
        }
        const { data } = await mutateWithToast("/api/admin/test-push", {
            method: "POST",
            body,
        });
        setTestLoading(false);
        if (data && typeof data === "object") {
            const res = data as { targetUserId?: string };
            setTestResult(data as typeof testResult);
            const uid = testUserId || res.targetUserId || "__all__";
            setLogsUserId(uid || "__all__");
            fetchPushLogs(uid || undefined);
        }
    };

    const businessItems = NOTIFICATION_CONFIG.filter((c) => c.role === "business");
    const driverItems = NOTIFICATION_CONFIG.filter((c) => c.role === "driver");

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bell className="h-8 w-8 text-orange-600" />
                        Notificaciones
                    </h2>
                    <p className="text-gray-500">Activa o desactiva las notificaciones push por tipo para cada rol.</p>
                </div>
                <button
                    onClick={fetchSettings}
                    disabled={loading}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="animate-pulse">
                        <CardHeader><div className="h-6 bg-gray-200 rounded w-1/2" /></CardHeader>
                        <CardContent><div className="h-24 bg-gray-100 rounded" /></CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-orange-600" />
                                Negocio
                            </CardTitle>
                            <CardDescription>Notificaciones que recibe el negocio en sus pedidos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {businessItems.map((item) => (
                                <div key={item.key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <Label className="font-medium">{item.label}</Label>
                                        <p className="text-xs text-gray-500">{item.description}</p>
                                    </div>
                                    <Switch
                                        checked={settings[item.key] ?? true}
                                        onCheckedChange={(v) => handleToggle(item.key, v)}
                                        disabled={saving === item.key}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-orange-600" />
                                Domiciliario
                            </CardTitle>
                            <CardDescription>Notificaciones que recibe el domiciliario.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {driverItems.map((item) => (
                                <div key={item.key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <Label className="font-medium">{item.label}</Label>
                                        <p className="text-xs text-gray-500">{item.description}</p>
                                    </div>
                                    <Switch
                                        checked={settings[item.key] ?? true}
                                        onCheckedChange={(v) => handleToggle(item.key, v)}
                                        disabled={saving === item.key}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="sm:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5 text-orange-600" />
                                Probar notificación push
                            </CardTitle>
                            <CardDescription>
                                Envía una notificación de prueba. Selecciona un usuario o prueba contigo mismo (activa notificaciones en tu navegador primero).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <Select value={testUserId} onValueChange={setTestUserId}>
                                    <SelectTrigger className="w-[280px]">
                                        <SelectValue placeholder="Seleccionar usuario…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={String(u._id)} value={String(u._id)}>
                                                {u.name} ({u.email}) — {u.role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    onClick={() => handleTestPush(false, false)}
                                    disabled={testLoading || !testUserId}
                                >
                                    {testLoading ? "Enviando…" : "Enviar"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleTestPush(false, true)}
                                    disabled={testLoading}
                                >
                                    Probar a mí mismo
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTestPush(true)}
                                    disabled={testLoading}
                                    title="Si suplantas un usuario, envía al suplantado"
                                >
                                    Usuario actual
                                </Button>
                            </div>
                            {testResult && (
                                <div className={`rounded-lg p-4 text-sm font-mono ${testResult.ok ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"}`}>
                                    {testResult.error && <p className="font-semibold mb-2">{testResult.error}</p>}
                                    {testResult.summary && (
                                        <p className="mb-2">
                                            Enviados: {testResult.summary.sent} / {testResult.summary.total}
                                            {testResult.summary.failed > 0 && ` (fallidos: ${testResult.summary.failed})`}
                                        </p>
                                    )}
                                    {testResult.logs && (
                                        <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-48">{testResult.logs.join("\n")}</pre>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="sm:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-600" />
                                Logs de push (trazabilidad end-to-end)
                            </CardTitle>
                            <CardDescription>
                                Recorrido de cada notificación: enviado → recibido por SW → mostrada. Filtra por usuario para ver el camino completo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Select value={logsUserId} onValueChange={(v) => { setLogsUserId(v); fetchPushLogs(v === "__all__" ? undefined : v); }}>
                                    <SelectTrigger className="w-[240px]">
                                        <SelectValue placeholder="Todos los usuarios" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={String(u._id)} value={String(u._id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={() => fetchPushLogs(logsUserId === "__all__" ? undefined : logsUserId)} disabled={logsLoading}>
                                    {logsLoading ? "Cargando…" : "Actualizar"}
                                </Button>
                            </div>
                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white border-b">
                                        <tr>
                                            <th className="text-left py-2 px-2">Usuario</th>
                                            <th className="text-left py-2 px-2">Título</th>
                                            <th className="text-left py-2 px-2">Tipo</th>
                                            <th className="text-left py-2 px-2">Estado</th>
                                            <th className="text-left py-2 px-2">Enviado</th>
                                            <th className="text-left py-2 px-2">Recibido</th>
                                            <th className="text-left py-2 px-2">Mostrado</th>
                                            <th className="text-left py-2 px-2">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pushLogs.length === 0 && !logsLoading && (
                                            <tr><td colSpan={8} className="py-4 text-center text-gray-500">Sin logs. Envía una prueba o espera un pedido.</td></tr>
                                        )}
                                        {pushLogs.map((log) => (
                                            <tr key={log.deliveryId} className="border-b hover:bg-gray-50">
                                                <td className="py-2 px-2">
                                                    {log.user ? `${log.user.name} (${log.user.role})` : log.userId.slice(-8)}
                                                </td>
                                                <td className="py-2 px-2 truncate max-w-[120px]">{log.payload?.title}</td>
                                                <td className="py-2 px-2">{log.type || "—"}</td>
                                                <td className="py-2 px-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                        log.status === "displayed" ? "bg-green-100 text-green-800" :
                                                        log.status === "received" ? "bg-blue-100 text-blue-800" :
                                                        log.status === "sent" ? "bg-gray-100 text-gray-800" :
                                                        log.status === "failed" ? "bg-red-100 text-red-800" :
                                                        "bg-amber-100 text-amber-800"
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2 text-xs">{log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}</td>
                                                <td className="py-2 px-2 text-xs">{log.receivedAt ? new Date(log.receivedAt).toLocaleString() : "—"}</td>
                                                <td className="py-2 px-2 text-xs">{log.displayedAt ? new Date(log.displayedAt).toLocaleString() : "—"}</td>
                                                <td className="py-2 px-2 text-xs text-red-600 max-w-[150px] truncate" title={log.errorMessage}>{log.errorMessage || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                                <p className="text-xs text-gray-500">
                                    <strong>sent</strong> = servidor envió; <strong>received</strong> = SW recibió; <strong>displayed</strong> = usuario vio la notificación; <strong>failed</strong> = error al enviar; <strong>error</strong> = fallo en el SW.
                                </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
