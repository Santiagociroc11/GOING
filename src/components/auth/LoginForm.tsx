"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

export default function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: z.infer<typeof loginSchema>) => {
        setLoading(true);
        try {
            const result = await signIn("credentials", {
                redirect: false,
                email: values.email,
                password: values.password,
            });

            if (!result) {
                console.error("[Login] Result null:", { result });
                toast.error("Error de conexión. Verifica tu internet e intenta de nuevo.");
                return;
            }

            if (result.error) {
                console.error("[Login] Error completo:", {
                    error: result.error,
                    status: result.status,
                    url: result.url,
                    ok: result.ok,
                    fullResult: result,
                });
                const err = String(result.error).toLowerCase();
                const mensaje =
                    err.includes("credential") ||
                    err.includes("authentication failed") ||
                    err.includes("invalid") ||
                    err.includes("incorrect")
                        ? "Correo o contraseña incorrectos. Verifica tus datos."
                        : err.includes("desactivada") || err.includes("disabled")
                          ? result.error
                          : "No se pudo iniciar sesión. Verifica tu correo y contraseña.";
                toast.error(mensaje);
                return;
            }

            toast.success("¡Bienvenido de nuevo!");
            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            console.error("[Login] Excepción:", err);
            toast.error("Error inesperado. Intenta de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-extrabold tracking-tight">Bienvenido</CardTitle>
                <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="m@example.com" autoComplete="email" {...field} />
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
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-transform hover:-translate-y-0.5" disabled={loading}>
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                        <p className="text-center text-sm text-gray-500 mt-4">
                            ¿No tienes cuenta? <a href="/register" className="text-orange-600 hover:underline">Regístrate</a>
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
