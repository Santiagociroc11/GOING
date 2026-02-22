"use client";

import { useEffect, useState } from "react";
import { fetchWithToast } from "@/lib/toast";
import { KPICard } from "@/components/ui/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RefreshCcw, DollarSign, Receipt, Building2 } from "lucide-react";

type Movement = {
    _id: string;
    price: number;
    createdAt: string;
    businessId: { _id: string; name: string; businessDetails?: { companyName?: string } };
    driverId?: { _id: string; name: string };
};

type FinanceData = {
    movements: Movement[];
    summary: { totalRevenue: number; totalOrders: number };
};

type Business = { _id: string; name: string; companyName: string };

export default function AdminFinancePage() {
    const [data, setData] = useState<FinanceData | null>(null);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [filterBusiness, setFilterBusiness] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const params = filterBusiness ? `?businessId=${filterBusiness}` : "";
        const { data: d, error } = await fetchWithToast<FinanceData>(`/api/admin/analytics/finance${params}`);
        if (!error && d) setData(d);
        setLoading(false);
    };

    const fetchBusinesses = async () => {
        const { data: b, error } = await fetchWithToast<Business[]>("/api/admin/analytics/businesses");
        if (!error && b) setBusinesses(b);
    };

    useEffect(() => {
        fetchBusinesses();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filterBusiness]);

    if (!data) return null;

    const movements = data.movements;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Movimientos Financieros</h2>
                    <p className="text-gray-500">Historial de ingresos por pedidos entregados.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterBusiness || "all"} onValueChange={(v) => setFilterBusiness(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Todos los negocios" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los negocios</SelectItem>
                            {businesses.map((b) => (
                                <SelectItem key={b._id} value={b._id}>
                                    {b.companyName || b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <KPICard icon={<DollarSign className="text-emerald-600" />} label="Ingresos Totales" value={`$${data.summary.totalRevenue.toFixed(2)}`} iconClassName="bg-emerald-100" />
                <KPICard icon={<Receipt className="text-blue-600" />} label="Pedidos Entregados" value={data.summary.totalOrders} iconClassName="bg-blue-100" />
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <div className="md:hidden divide-y">
                    {movements.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">No hay movimientos con los filtros seleccionados.</div>
                    )}
                    {movements.map((m) => (
                        <div key={m._id} className="p-4 space-y-1">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-sm">
                                    {(m.businessId as any)?.businessDetails?.companyName || (m.businessId as any)?.name || "—"}
                                </span>
                                <span className="font-semibold text-emerald-600">${m.price.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</p>
                            {(m.driverId as any)?.name && (
                                <p className="text-xs text-gray-400">{(m.driverId as any).name}</p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Fecha</TableHead>
                            <TableHead>Negocio</TableHead>
                            <TableHead>Domiciliario</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                                    No hay movimientos con los filtros seleccionados.
                                </TableCell>
                            </TableRow>
                        )}
                        {movements.map((m) => (
                            <TableRow key={m._id}>
                                <TableCell className="text-gray-600">
                                    {new Date(m.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium">
                                        {(m.businessId as any)?.businessDetails?.companyName ||
                                            (m.businessId as any)?.name ||
                                            "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    {(m.driverId as any)?.name || "—"}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-emerald-600">
                                    ${m.price.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
        </div>
    );
}
