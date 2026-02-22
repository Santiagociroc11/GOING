"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Package } from "lucide-react";

// Simula coordenadas para MVP sin API de mapas. Usa pickup y dropoff separados ~5km
// para que el precio sea consistente (base + ~5km * precio). En producción usar geocoding.
const BASE_LNG = -74.006;
const BASE_LAT = 40.7128;
// ~0.045 grados ≈ 5km en latitud
const OFFSET_KM = 0.045;

const getPickupCoordinates = (): [number, number] => [BASE_LNG, BASE_LAT];
const getDropoffCoordinates = (): [number, number] => [
    BASE_LNG + OFFSET_KM,
    BASE_LAT + OFFSET_KM * 0.5,
];

const orderSchema = z.object({
    pickupAddress: z.string().min(5, "Por favor ingresa una dirección completa"),
    pickupContactName: z.string().min(2, "Se requiere un nombre de contacto"),
    pickupContactPhone: z.string().min(6, "Se requiere un teléfono"),
    dropoffAddress: z.string().min(5, "Por favor ingresa una dirección completa"),
    dropoffContactName: z.string().min(2, "Se requiere un nombre de contacto"),
    dropoffContactPhone: z.string().min(6, "Se requiere un teléfono"),
    details: z.string().min(3, "Por favor describe el paquete"),
});

export default function NewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof orderSchema>>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            pickupAddress: "", pickupContactName: "", pickupContactPhone: "",
            dropoffAddress: "", dropoffContactName: "", dropoffContactPhone: "",
            details: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof orderSchema>) => {
        try {
            setLoading(true);

            const payload = {
                details: values.details,
                pickupInfo: {
                    address: values.pickupAddress,
                    contactName: values.pickupContactName,
                    contactPhone: values.pickupContactPhone,
                    coordinates: getPickupCoordinates(),
                },
                dropoffInfo: {
                    address: values.dropoffAddress,
                    contactName: values.dropoffContactName,
                    contactPhone: values.dropoffContactPhone,
                    coordinates: getDropoffCoordinates(),
                }
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("¡Pedido creado exitosamente!");
                router.push("/dashboard/business/orders");
                router.refresh();
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Error al crear el pedido");
            }
        } catch (error) {
            toast.error("Ocurrió un error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6">
            <Card className="shadow-xl border-0 border-t-4 border-t-orange-600">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Nueva Solicitud de Envío</CardTitle>
                            <CardDescription>Completa los detalles para despachar un domiciliario.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Pickup Section */}
                            <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                                    <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                    Detalles de Recogida
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="pickupAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección de Recogida</FormLabel>
                                            <FormControl><Input placeholder="Ej: Calle 100 #15-30, Local 1" {...field} /></FormControl>
                                            <FormMessage />
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
                                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
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
                                                <FormControl><Input placeholder="300 123 4567" {...field} /></FormControl>
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
                                            <FormControl><Input placeholder="Ej: Avenida Siempre Viva 123" {...field} /></FormControl>
                                            <FormMessage />
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

                            <div className="pt-4 border-t">
                                <Button
                                    type="submit"
                                    className="w-full text-lg h-12 bg-orange-600 hover:bg-orange-700 shadow-lg transition-transform hover:-translate-y-0.5"
                                    disabled={loading}
                                >
                                    {loading ? "Calculando y Creando..." : "Solicitar Domiciliario"}
                                </Button>
                                <p className="text-center text-xs text-gray-500 mt-3">
                                    El precio se calculará automáticamente basado en las tarifas activas de tu ciudad.
                                </p>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
