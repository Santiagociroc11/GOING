"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Users, Truck, DollarSign } from "lucide-react";
import { fetchWithToast } from "@/lib/toast";

type Stats = {
    totalOrders: number;
    ordersToday: number;
    ordersThisWeek: number;
    deliveredToday: number;
    totalRevenue: number;
    activeBusinesses: number;
    activeDrivers: number;
};

export function AdminKpiCards() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetchWithToast<Stats>("/api/admin/stats").then(({ data }) => {
            if (data) setStats(data);
        });
    }, []);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Pedidos hoy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.ordersToday}</p>
                    <p className="text-xs text-gray-500">Esta semana: {stats.ordersThisWeek}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Entregados hoy
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-emerald-600">{stats.deliveredToday}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Ingresos totales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Activos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{stats.activeBusinesses} neg. · {stats.activeDrivers} dom.</p>
                </CardContent>
            </Card>
        </div>
    );
}
