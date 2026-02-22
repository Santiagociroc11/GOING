"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithToast } from "@/lib/toast";
import { Wallet } from "lucide-react";

export function BalanceCard() {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        fetchWithToast<{ balance: number }>("/api/wallet/balance").then(({ data }) => {
            if (data) setBalance(data.balance);
        });
    }, []);

    if (balance === null) return null;

    return (
        <Card className="hover:shadow-lg transition-shadow border-emerald-100 bg-emerald-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <Wallet className="h-5 w-5" />
                    Saldo disponible
                </CardTitle>
                <CardDescription>Tu saldo prepago para domicilios. Recarga con el administrador si necesitas más.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-emerald-700">${balance.toLocaleString()}</p>
            </CardContent>
        </Card>
    );
}
