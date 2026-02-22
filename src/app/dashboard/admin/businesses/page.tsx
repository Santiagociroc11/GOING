"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchWithToast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Building2, ShoppingCart, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type Business = {
    _id: string;
    name: string;
    email: string;
    city: string;
    companyName: string;
    totalOrders: number;
    totalSpent: number;
    lastOrder: string | null;
    createdAt: string;
};

type SortKey = "name" | "companyName" | "city" | "totalOrders" | "totalSpent" | "lastOrder";

export default function AdminBusinessesPage() {
    const [data, setData] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>("totalOrders");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const fetchData = async () => {
        setLoading(true);
        const { data: d, error } = await fetchWithToast<Business[]>("/api/admin/analytics/businesses");
        if (!error && d) setData(d);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sorted = useMemo(() => {
        return [...data].sort((a, b) => {
            let va: string | number = a[sortKey] ?? "";
            let vb: string | number = b[sortKey] ?? "";
            if (sortKey === "lastOrder") {
                va = a.lastOrder ? new Date(a.lastOrder).getTime() : 0;
                vb = b.lastOrder ? new Date(b.lastOrder).getTime() : 0;
            }
            if (typeof va === "string") va = va.toLowerCase();
            if (typeof vb === "string") vb = vb.toLowerCase();
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    const kpis = useMemo(() => ({
        total: data.length,
        totalOrders: data.reduce((s, b) => s + b.totalOrders, 0),
        totalRevenue: data.reduce((s, b) => s + b.totalSpent, 0),
    }), [data]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else setSortKey(key);
    };

    const SortIcon = ({ col }: { col: SortKey }) =>
        sortKey === col ? (
            sortDir === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
        ) : (
            <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Negocios</h2>
                    <p className="text-gray-500">Análisis de negocios y pedidos realizados.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100">
                                <Building2 className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Negocios</p>
                                <p className="text-2xl font-bold">{kpis.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pedidos Entregados</p>
                                <p className="text-2xl font-bold">{kpis.totalOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ingresos Totales</p>
                                <p className="text-2xl font-bold">${kpis.totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("name")}>
                                    Negocio <SortIcon col="name" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("companyName")}>
                                    Empresa <SortIcon col="companyName" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("city")}>
                                    Ciudad <SortIcon col="city" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("totalOrders")}>
                                    Pedidos <SortIcon col="totalOrders" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("totalSpent")}>
                                    Total $ <SortIcon col="totalSpent" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("lastOrder")}>
                                    Último <SortIcon col="lastOrder" />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((b) => (
                            <TableRow key={b._id}>
                                <TableCell className="font-medium">{b.name}</TableCell>
                                <TableCell>{b.companyName}</TableCell>
                                <TableCell>{b.city}</TableCell>
                                <TableCell>{b.totalOrders}</TableCell>
                                <TableCell className="font-semibold text-emerald-600">${b.totalSpent.toFixed(2)}</TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {b.lastOrder ? new Date(b.lastOrder).toLocaleDateString() : "—"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
