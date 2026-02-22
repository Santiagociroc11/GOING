"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchWithToast } from "@/lib/toast";
import { Wallet, AlertTriangle } from "lucide-react";

const LOW_BALANCE_THRESHOLD = 50000;

export function BalanceCard() {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        fetchWithToast<{ balance: number }>("/api/wallet/balance").then(({ data }) => {
            if (data) setBalance(data.balance);
        });
    }, []);

    if (balance === null) return null;

    const isLow = balance < LOW_BALANCE_THRESHOLD;

    return (
        <Card className={`hover:shadow-lg transition-shadow ${isLow ? "border-amber-200 bg-amber-50/30" : "border-emerald-100 bg-emerald-50/30"}`}>
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isLow ? "text-amber-700" : "text-emerald-700"}`}>
                    <Wallet className="h-5 w-5" />
                    Saldo disponible
                </CardTitle>
                <CardDescription>
                    {isLow ? "Tu saldo es bajo. Recarga pronto para no interrumpir tus envíos." : "Tu saldo prepago para domicilios. Recarga con el administrador si necesitas más."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className={`text-2xl font-bold ${isLow ? "text-amber-700" : "text-emerald-700"}`}>${balance.toLocaleString()}</p>
                {isLow && (
                    <div className="flex items-center gap-2 p-3 bg-amber-100 rounded-lg text-amber-800 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Saldo bajo. Contacta al admin para recargar.</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
