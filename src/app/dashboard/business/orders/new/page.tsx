"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast, mutateWithToast, fetchWithToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Package, Wallet, Building2, MapPin, Loader2 } from "lucide-react";
import { RoutePreviewMap } from "@/components/RoutePreviewMap";
import { SinglePointMap } from "@/components/SinglePointMap";

const orderSchema = z.object({
    pickupAddress: z.string().min(5, "Por favor ingresa una dirección completa"),
    pickupContactName: z.string().min(2, "Se requiere un nombre de contacto"),
    pickupContactPhone: z.string().min(6, "Se requiere un teléfono"),
    dropoffAddress: z.string().min(5, "Por favor ingresa una dirección completa"),
    dropoffContactName: z.string().min(2, "Se requiere un nombre de contacto"),
    dropoffContactPhone: z.string().min(6, "Se requiere un teléfono"),
    details: z.string().min(3, "Por favor describe el paquete"),
    paymentMethod: z.enum(["PREPAID", "COD"]),
    productValue: z.number().optional(),
}).refine((data) => {
    if (data.paymentMethod === "COD") return data.productValue != null && data.productValue >= 0;
    return true;
}, { message: "Para recaudo contraentrega indica el valor del producto", path: ["productValue"] });

export default function NewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [useBusinessAddress, setUseBusinessAddress] = useState(false);
    const [hasSavedPickup, setHasSavedPickup] = useState(false);
    const [preview, setPreview] = useState<{
        distanceKm: number;
        price: number | null;
        city: string;
        pickupCoords?: [number, number];
        dropoffCoords?: [number, number];
    } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [pickupMapCoords, setPickupMapCoords] = useState<[number, number] | null>(null);
    const [dropoffMapCoords, setDropoffMapCoords] = useState<[number, number] | null>(null);
    const [loadingPickupMap, setLoadingPickupMap] = useState(false);
    const [loadingDropoffMap, setLoadingDropoffMap] = useState(false);

    const form = useForm<z.infer<typeof orderSchema>>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            pickupAddress: "", pickupContactName: "", pickupContactPhone: "",
            dropoffAddress: "", dropoffContactName: "", dropoffContactPhone: "",
            details: "",
            paymentMethod: "PREPAID",
            productValue: undefined,
        },
    });

    const isCod = form.watch("paymentMethod") === "COD";

    useEffect(() => {
        fetchWithToast<{ balance: number }>("/api/wallet/balance").then(({ data }) => {
            if (data) setBalance(data.balance);
        });
    }, []);

    useEffect(() => {
        if (useBusinessAddress) {
            fetchWithToast<{ pickupAddress: string; pickupContactName: string; pickupContactPhone: string }>("/api/business/pickup").then(
                ({ data }) => {
                    if (data?.pickupAddress) {
                        form.setValue("pickupAddress", data.pickupAddress);
                        form.setValue("pickupContactName", data.pickupContactName ?? "");
                        form.setValue("pickupContactPhone", data.pickupContactPhone ?? "");
                        setHasSavedPickup(true);
                    } else {
                        form.setValue("pickupAddress", "");
                        form.setValue("pickupContactName", "");
                        form.setValue("pickupContactPhone", "");
                        setHasSavedPickup(false);
                    }
                }
            );
        } else {
            setHasSavedPickup(false);
        }
    }, [useBusinessAddress]);

    const fetchPreview = async () => {
        const pickup = form.getValues("pickupAddress");
        const dropoff = form.getValues("dropoffAddress");
        if (!pickup || !dropoff || pickup.length < 5 || dropoff.length < 5) {
            setPreview(null);
            return;
        }
        setLoadingPreview(true);
        setPreview(null);
        const { data, error } = await fetchWithToast<{
            distanceKm: number;
            price: number | null;
            city: string;
            pickupCoords?: [number, number];
            dropoffCoords?: [number, number];
        }>("/api/geocode/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pickupAddress: pickup, dropoffAddress: dropoff }),
        });
        setLoadingPreview(false);
        if (!error && data) setPreview(data);
    };

    const fetchAddressMap = async (type: "pickup" | "dropoff") => {
        const address = type === "pickup" ? form.getValues("pickupAddress") : form.getValues("dropoffAddress");
        if (!address || address.length < 5) {
            toast.error("Escribe una dirección de al menos 5 caracteres");
            return;
        }
        if (type === "pickup") {
            setLoadingPickupMap(true);
            setPickupMapCoords(null);
        } else {
            setLoadingDropoffMap(true);
            setDropoffMapCoords(null);
        }
        const { data, error } = await fetchWithToast<{ coords: [number, number] }>("/api/geocode/single", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address }),
        });
        if (type === "pickup") setLoadingPickupMap(false);
        else setLoadingDropoffMap(false);
        if (!error && data?.coords) {
            if (type === "pickup") setPickupMapCoords(data.coords);
            else setDropoffMapCoords(data.coords);
        }
    };

    const onSubmit = async (values: z.infer<typeof orderSchema>) => {
        setLoading(true);
        if (useBusinessAddress && (values.pickupAddress || values.pickupContactName || values.pickupContactPhone)) {
            await mutateWithToast("/api/business/pickup", {
                method: "PATCH",
                body: {
                    pickupAddress: values.pickupAddress,
                    pickupContactName: values.pickupContactName,
                    pickupContactPhone: values.pickupContactPhone,
                },
            });
        }
        const payload = {
            details: values.details,
            paymentMethod: values.paymentMethod,
            productValue: values.paymentMethod === "COD" ? values.productValue : undefined,
            pickupInfo: {
                address: values.pickupAddress,
                contactName: values.pickupContactName,
                contactPhone: values.pickupContactPhone,
                ...(pickupMapCoords && { coordinates: pickupMapCoords }),
            },
            dropoffInfo: {
                address: values.dropoffAddress,
                contactName: values.dropoffContactName,
                contactPhone: values.dropoffContactPhone,
                ...(dropoffMapCoords && { coordinates: dropoffMapCoords }),
            },
        };

        const { ok } = await mutateWithToast("/api/orders", { method: "POST", body: payload });
        setLoading(false);
        if (ok) {
            toast.success("¡Pedido creado exitosamente!");
            router.push("/dashboard/business/orders");
            router.refresh();
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6">
            <Card className="shadow-xl border-0 border-t-4 border-t-orange-600">
                <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                                <Package className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">Nueva Solicitud de Envío</CardTitle>
                                <CardDescription>Completa los detalles para despachar un domiciliario.</CardDescription>
                            </div>
                        </div>
                        {balance !== null && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${balance < 50000 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-100"}`}>
                                <Wallet className={`h-5 w-5 ${balance < 50000 ? "text-amber-600" : "text-emerald-600"}`} />
                                <span className={`font-semibold ${balance < 50000 ? "text-amber-700" : "text-emerald-700"}`}>${balance.toLocaleString()}</span>
                                <span className={`text-sm ${balance < 50000 ? "text-amber-600" : "text-emerald-600"}`}>saldo</span>
                                {balance < 50000 && <span className="text-xs text-amber-600">(bajo)</span>}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Pickup Section */}
                            <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                                        <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                        Detalles de Recogida
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={useBusinessAddress}
                                            onChange={(e) => setUseBusinessAddress(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <Building2 className="h-4 w-4 text-orange-600" />
                                        La recogida es en mi negocio
                                    </label>
                                </div>
                                {useBusinessAddress && (
                                    <p className="text-sm text-gray-600 bg-orange-50/50 border border-orange-100 rounded-lg px-3 py-2">
                                        {hasSavedPickup ? (
                                            <>
                                                Usando la dirección guardada de tu negocio.{" "}
                                                <button type="button" onClick={() => setHasSavedPickup(false)} className="text-orange-600 hover:underline font-medium">
                                                    Cambiar
                                                </button>
                                            </>
                                        ) : (
                                            "Completa tu dirección para guardarla y usarla en futuros pedidos."
                                        )}
                                    </p>
                                )}
                                <FormField
                                    control={form.control}
                                    name="pickupAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección de Recogida</FormLabel>
                                            <FormControl><Input placeholder="Ej: Calle 5 #10-20, Ciénaga" {...field} disabled={useBusinessAddress && hasSavedPickup} /></FormControl>
                                            <FormMessage />
                                            <div className="mt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fetchAddressMap("pickup")}
                                                    disabled={loadingPickupMap || !form.watch("pickupAddress") || form.watch("pickupAddress").length < 5 || (useBusinessAddress && hasSavedPickup)}
                                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                >
                                                    {loadingPickupMap ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                                                    Ver en mapa
                                                </Button>
                                                {pickupMapCoords && (
                                                    <div className="mt-2">
                                                        <SinglePointMap
                                                            coords={pickupMapCoords}
                                                            variant="pickup"
                                                            height={140}
                                                            editable
                                                            onCoordsChange={setPickupMapCoords}
                                                        />
                                                        <button type="button" onClick={() => setPickupMapCoords(null)} className="text-xs text-gray-500 hover:underline mt-1">Ocultar mapa</button>
                                                    </div>
                                                )}
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="pickupContactName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre de Contacto</FormLabel>
                                                <FormControl><Input placeholder="John Doe" {...field} disabled={useBusinessAddress && hasSavedPickup} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pickupContactPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono de Contacto</FormLabel>
                                                <FormControl><Input placeholder="300 123 4567" {...field} disabled={useBusinessAddress && hasSavedPickup} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Dropoff Section */}
                            <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                                    <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                    Detalles de Entrega
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="dropoffAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección de Entrega</FormLabel>
                                            <FormControl><Input placeholder="Ej: Carrera 3 #15-40, Ciénaga" {...field} /></FormControl>
                                            <FormMessage />
                                            <div className="mt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fetchAddressMap("dropoff")}
                                                    disabled={loadingDropoffMap || !form.watch("dropoffAddress") || form.watch("dropoffAddress").length < 5}
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                >
                                                    {loadingDropoffMap ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                                                    Ver en mapa
                                                </Button>
                                                {dropoffMapCoords && (
                                                    <div className="mt-2">
                                                        <SinglePointMap
                                                            coords={dropoffMapCoords}
                                                            variant="dropoff"
                                                            height={140}
                                                            editable
                                                            onCoordsChange={setDropoffMapCoords}
                                                        />
                                                        <button type="button" onClick={() => setDropoffMapCoords(null)} className="text-xs text-gray-500 hover:underline mt-1">Ocultar mapa</button>
                                                    </div>
                                                )}
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="dropoffContactName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Destinatario</FormLabel>
                                                <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dropoffContactPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono del Destinatario</FormLabel>
                                                <FormControl><Input placeholder="310 987 6543" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Preview distancia */}
                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchPreview}
                                    disabled={loadingPreview || !form.watch("pickupAddress") || !form.watch("dropoffAddress") || form.watch("pickupAddress").length < 5 || form.watch("dropoffAddress").length < 5}
                                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                                >
                                    {loadingPreview ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                                    Ver distancia y precio estimado
                                </Button>
                                {preview && (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-4 p-4 bg-orange-50/50 border border-orange-100 rounded-lg">
                                            <span className="font-medium text-orange-800">
                                                ~{preview.distanceKm} km
                                            </span>
                                            {preview.price != null && (
                                                <span className="font-bold text-orange-600">
                                                    ${preview.price.toLocaleString()} (estimado)
                                                </span>
                                            )}
                                            {preview.price == null && (
                                                <span className="text-sm text-amber-600">Sin tarifa configurada para {preview.city}</span>
                                            )}
                                        </div>
                                        {preview.pickupCoords && preview.dropoffCoords && (
                                            <RoutePreviewMap
                                                pickupCoords={preview.pickupCoords}
                                                dropoffCoords={preview.dropoffCoords}
                                                height={200}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Package Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-gray-800">Información del Paquete</h3>
                                <FormField
                                    control={form.control}
                                    name="details"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>¿Qué se va a entregar?</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: 2 cajas grandes, documentos, frágil." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Payment / COD */}
                            <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                <h3 className="font-semibold text-lg text-gray-800">Forma de pago</h3>
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5 flex-1">
                                                <FormLabel className="text-base">Recaudo contraentrega (COD)</FormLabel>
                                                <p className="text-sm text-gray-500">
                                                    El domiciliario recaudará el valor del producto en efectivo al entregar.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value === "COD"}
                                                    onChange={(e) => field.onChange(e.target.checked ? "COD" : "PREPAID")}
                                                    className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {isCod && (
                                    <FormField
                                        control={form.control}
                                        name="productValue"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valor del producto a recaudar ($)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        placeholder="Ej: 25000"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <Button
                                    type="submit"
                                    className="w-full text-lg h-12 bg-orange-600 hover:bg-orange-700 shadow-lg transition-transform hover:-translate-y-0.5"
                                    disabled={loading}
                                >
                                    {loading ? "Buscando direcciones y calculando..." : "Solicitar Domiciliario"}
                                </Button>
                                <p className="text-center text-xs text-gray-500 mt-3">
                                    Las direcciones se ubican automáticamente (Mapbox). El precio se calcula por distancia.
                                    Se guardan la <strong>dirección escrita</strong> y la <strong>ubicación del mapa</strong> para que el domiciliario vea ambas.
                                </p>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
