"use client";

import { useEffect, useState } from "react";
import { fetchWithToast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
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
                    <h2 className="text-3xl font-bold tracking-tight">Movimientos Financieros</h2>
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

            <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ingresos Totales</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    ${data.summary.totalRevenue.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Receipt className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pedidos Entregados</p>
                                <p className="text-2xl font-bold">{data.summary.totalOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
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
    );
}
