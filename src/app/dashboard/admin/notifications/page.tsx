"use client";

import { useEffect, useState } from "react";
import { fetchWithToast, mutateWithToast, toast } from "@/lib/toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw, Bell, Building2, Truck, Send } from "lucide-react";
import type { NotificationType } from "@/models/NotificationSettings";

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
    const [testUserId, setTestUserId] = useState("");
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; logs?: string[]; error?: string; summary?: { sent: number; failed: number; total: number }; results?: { ok: boolean; error?: string }[] } | null>(null);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await fetchWithToast<Record<string, boolean>>("/api/admin/notification-settings");
        if (!error && data) setSettings(data ?? {});
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
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

    const handleTestPush = async (useCurrentUser: boolean) => {
        setTestLoading(true);
        setTestResult(null);
        const body = useCurrentUser ? { useCurrentUser: true } : { userId: testUserId.trim() };
        if (!useCurrentUser && !testUserId.trim()) {
            toast.warning("Escribe un userId o usa 'Probar a usuario actual'");
            setTestLoading(false);
            return;
        }
        const { data } = await mutateWithToast("/api/admin/test-push", {
            method: "POST",
            body,
        });
        setTestLoading(false);
        if (data && typeof data === "object") setTestResult(data as typeof testResult);
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
                                Envía una notificación de prueba para diagnosticar problemas. Si suplantas un usuario, usa &quot;Probar a usuario actual&quot;.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <Input
                                    placeholder="ID del usuario (ej: 507f1f77bcf86cd799439011)"
                                    value={testUserId}
                                    onChange={(e) => setTestUserId(e.target.value)}
                                    className="max-w-xs"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => handleTestPush(false)}
                                    disabled={testLoading}
                                >
                                    {testLoading ? "Enviando…" : "Enviar a userId"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleTestPush(true)}
                                    disabled={testLoading}
                                >
                                    Probar a usuario actual
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
                </div>
            )}
        </div>
    );
}
