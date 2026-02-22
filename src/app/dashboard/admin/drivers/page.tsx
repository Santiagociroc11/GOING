"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchWithToast } from "@/lib/toast";
import { KPICard } from "@/components/ui/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Truck, PackageCheck, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type Driver = {
    _id: string;
    name: string;
    email: string;
    city: string;
    vehicleType: string;
    licensePlate: string;
    totalDeliveries: number;
    totalEarned: number;
    lastDelivery: string | null;
    createdAt: string;
};

type SortKey = "name" | "city" | "vehicleType" | "totalDeliveries" | "totalEarned" | "lastDelivery";

export default function AdminDriversPage() {
    const [data, setData] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>("totalDeliveries");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const fetchData = async () => {
        setLoading(true);
        const { data: d, error } = await fetchWithToast<Driver[]>("/api/admin/analytics/drivers");
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
            if (sortKey === "lastDelivery") {
                va = a.lastDelivery ? new Date(a.lastDelivery).getTime() : 0;
                vb = b.lastDelivery ? new Date(b.lastDelivery).getTime() : 0;
            }
            if (typeof va === "string") va = va.toLowerCase();
            if (typeof vb === "string") vb = vb.toLowerCase();
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir]);

    const kpis = useMemo(() => ({
        total: data.length,
        totalDeliveries: data.reduce((s, d) => s + d.totalDeliveries, 0),
        totalEarned: data.reduce((s, d) => s + d.totalEarned, 0),
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
                    <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Domiciliarios</h2>
                    <p className="text-gray-500">Análisis de conductores y entregas realizadas.</p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <KPICard icon={<Truck className="text-orange-600" />} label="Total Domiciliarios" value={kpis.total} iconClassName="bg-orange-100" />
                <KPICard icon={<PackageCheck className="text-blue-600" />} label="Entregas Completadas" value={kpis.totalDeliveries} iconClassName="bg-blue-100" />
                <KPICard icon={<DollarSign className="text-emerald-600" />} label="Total Entregas ($)" value={`$${kpis.totalEarned.toFixed(2)}`} iconClassName="bg-emerald-100" />
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <div className="md:hidden divide-y">
                    {sorted.map((d) => (
                        <div key={d._id} className="p-4 space-y-1">
                            <p className="font-semibold text-gray-900">{d.name}</p>
                            <p className="text-sm text-gray-600">{d.city} · {d.vehicleType}</p>
                            <div className="flex justify-between text-sm pt-2">
                                <span className="text-gray-500">{d.totalDeliveries} entregas</span>
                                <span className="font-semibold text-emerald-600">${d.totalEarned.toFixed(2)}</span>
                            </div>
                            {d.lastDelivery && (
                                <p className="text-xs text-gray-400">{new Date(d.lastDelivery).toLocaleDateString()}</p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("name")}>
                                    Domiciliario <SortIcon col="name" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("city")}>
                                    Ciudad <SortIcon col="city" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("vehicleType")}>
                                    Vehículo <SortIcon col="vehicleType" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("totalDeliveries")}>
                                    Entregas <SortIcon col="totalDeliveries" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("totalEarned")}>
                                    Total $ <SortIcon col="totalEarned" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="font-semibold -ml-2" onClick={() => toggleSort("lastDelivery")}>
                                    Última <SortIcon col="lastDelivery" />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((d) => (
                            <TableRow key={d._id}>
                                <TableCell className="font-medium">{d.name}</TableCell>
                                <TableCell>{d.city}</TableCell>
                                <TableCell>{d.vehicleType}</TableCell>
                                <TableCell>{d.totalDeliveries}</TableCell>
                                <TableCell className="font-semibold text-emerald-600">${d.totalEarned.toFixed(2)}</TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {d.lastDelivery ? new Date(d.lastDelivery).toLocaleDateString() : "—"}
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
