import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function DriverLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="bg-gray-50/50 pb-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                            <Skeleton className="h-7 w-20 mt-2" />
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-3">
                                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                                <div className="grid gap-2 flex-1">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                                <div className="grid gap-2 flex-1">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                            <Skeleton className="h-12 w-full rounded-md" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-12 w-full rounded-md" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
