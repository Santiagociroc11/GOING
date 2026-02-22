"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    iconClassName?: string;
    className?: string;
}

export function KPICard({ icon, label, value, iconClassName, className }: KPICardProps) {
    return (
        <Card className={cn("py-3 px-3 sm:py-6 sm:px-6", className)}>
            <CardContent className="p-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className={cn("p-1.5 sm:p-2 rounded-md sm:rounded-lg shrink-0 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-6 sm:[&>svg]:w-6", iconClassName)}>
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
                        <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
