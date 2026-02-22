"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast, mutateWithToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    city: z.string().min(2, "La ciudad es obligatoria"),
    role: z.enum(["BUSINESS", "DRIVER"]),
    companyName: z.string().optional(),
    vehicleType: z.string().optional(),
    licensePlate: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === "BUSINESS" && (!data.companyName || data.companyName.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El nombre de la empresa es obligatorio",
            path: ["companyName"],
        });
    }
    if (data.role === "DRIVER" && (!data.vehicleType || data.vehicleType.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El tipo de vehículo es obligatorio",
            path: ["vehicleType"],
        });
    }
});

export default function RegisterForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            city: "",
            role: "BUSINESS",
            companyName: "",
            vehicleType: "",
            licensePlate: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof registerSchema>) => {
        setLoading(true);
        const payload = {
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
            city: values.city,
            businessDetails: values.role === "BUSINESS" ? { companyName: values.companyName } : undefined,
            driverDetails: values.role === "DRIVER" ? { vehicleType: values.vehicleType, licensePlate: values.licensePlate } : undefined,
        };

        const { ok } = await mutateWithToast("/api/auth/register", { method: "POST", body: payload });
        setLoading(false);
        if (ok) {
            toast.success("¡Registro exitoso! Ya puedes iniciar sesión.");
            router.push("/login");
        }
    };

    return (
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-extrabold tracking-tight">Crear una cuenta</CardTitle>
                <CardDescription>Únete a la red de Going para despachar o entregar hoy.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="BUSINESS" onValueChange={(val) => form.setValue("role", val as "BUSINESS" | "DRIVER")} className="mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="BUSINESS">Negocio</TabsTrigger>
                        <TabsTrigger value="DRIVER">Conductor</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad</FormLabel>
                                        <FormControl>
                                            <Input placeholder="New York" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="m@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch("role") === "BUSINESS" && (
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Empresa</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Acme Corp" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {form.watch("role") === "DRIVER" && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vehicleType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Vehículo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Motorcycle">Moto</SelectItem>
                                                    <SelectItem value="Car">Carro</SelectItem>
                                                    <SelectItem value="Bicycle">Bicicleta</SelectItem>
                                                    <SelectItem value="Van">Camioneta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="licensePlate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Placa (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ABC-123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-transform hover:-translate-y-0.5" disabled={loading}>
                            {loading ? "Creando cuenta..." : "Registrarse"}
                        </Button>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            ¿Ya tienes cuenta? <a href="/login" className="text-orange-600 hover:underline">Inicia sesión</a>
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
