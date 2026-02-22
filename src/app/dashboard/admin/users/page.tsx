"use client";

import { useEffect, useState } from "react";
import { toast, mutateWithToast, fetchWithToast } from "@/lib/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, UserPlus, Users } from "lucide-react";

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    city: string;
    active: boolean;
    createdAt: string;
    businessDetails?: { companyName?: string };
    driverDetails?: { vehicleType?: string; licensePlate?: string };
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<"BUSINESS" | "DRIVER" | "ADMIN">("BUSINESS");
    const [newCity, setNewCity] = useState("");
    const [newCompanyName, setNewCompanyName] = useState("");
    const [newVehicleType, setNewVehicleType] = useState("");
    const [newLicensePlate, setNewLicensePlate] = useState("");
    const [storePlainPassword, setStorePlainPassword] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await fetchWithToast<User[]>("/api/admin/users");
        if (!error && data) setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("BUSINESS");
        setNewCity("");
        setNewCompanyName("");
        setNewVehicleType("");
        setNewLicensePlate("");
        setStorePlainPassword(false);
    };

    const handleCreateUser = async () => {
        if (!newName.trim() || !newEmail.trim() || !newPassword.trim() || !newCity.trim()) {
            toast.error("Completa nombre, email, contraseña y ciudad");
            return;
        }

        setCreating(true);
        const { ok } = await mutateWithToast("/api/admin/users", {
            method: "POST",
            body: {
                name: newName.trim(),
                email: newEmail.trim(),
                password: newPassword,
                role: newRole,
                city: newCity.trim(),
                active: true,
                storePlainPassword,
                businessDetails: newRole === "BUSINESS" ? { companyName: newCompanyName || undefined } : undefined,
                driverDetails: newRole === "DRIVER" ? { vehicleType: newVehicleType || undefined, licensePlate: newLicensePlate || undefined } : undefined,
            },
        });
        setCreating(false);
        if (ok) {
            toast.success("Usuario creado correctamente");
            setIsDialogOpen(false);
            resetForm();
            fetchUsers();
        }
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, string> = {
            ADMIN: "bg-red-100 text-red-700",
            BUSINESS: "bg-blue-100 text-blue-700",
            DRIVER: "bg-green-100 text-green-700",
        };
        return <Badge variant="outline" className={variants[role] || ""}>{role}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8 text-orange-600" />
                        Gestión de Usuarios
                    </h2>
                    <p className="text-gray-500">Visualiza y crea usuarios de la plataforma.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchUsers} title="Actualizar">
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-600 hover:bg-orange-700">
                                <UserPlus className="h-4 w-4 mr-2" /> Crear Usuario
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nuevo Usuario</DialogTitle>
                                <DialogDescription>
                                    Crea un usuario con cualquier rol (Negocio, Conductor o Admin).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nombre</Label>
                                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" placeholder="Juan Pérez" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="col-span-3" placeholder="juan@ejemplo.com" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Contraseña</Label>
                                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="col-span-3" placeholder="••••••••" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Rol</Label>
                                    <Select value={newRole} onValueChange={(v) => setNewRole(v as "BUSINESS" | "DRIVER" | "ADMIN")}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BUSINESS">Negocio</SelectItem>
                                            <SelectItem value="DRIVER">Conductor</SelectItem>
                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Ciudad</Label>
                                    <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} className="col-span-3" placeholder="BOGOTA" />
                                </div>

                                {newRole === "BUSINESS" && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Empresa</Label>
                                        <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="col-span-3" placeholder="Mi Empresa S.A.S" />
                                    </div>
                                )}

                                {newRole === "DRIVER" && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Vehículo</Label>
                                            <Select value={newVehicleType} onValueChange={setNewVehicleType}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Motorcycle">Moto</SelectItem>
                                                    <SelectItem value="Car">Carro</SelectItem>
                                                    <SelectItem value="Bicycle">Bicicleta</SelectItem>
                                                    <SelectItem value="Van">Camioneta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Placa</Label>
                                            <Input value={newLicensePlate} onChange={(e) => setNewLicensePlate(e.target.value)} className="col-span-3" placeholder="ABC-123" />
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right col-span-1"></Label>
                                    <label className="col-span-3 flex items-center gap-2 text-sm text-gray-600">
                                        <input type="checkbox" checked={storePlainPassword} onChange={(e) => setStorePlainPassword(e.target.checked)} className="rounded" />
                                        Guardar contraseña en texto plano
                                    </label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateUser} disabled={creating} className="bg-orange-600 hover:bg-orange-700">
                                    {creating ? "Creando..." : "Crear Usuario"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Ciudad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Registro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    No hay usuarios registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>{user.city}</TableCell>
                                <TableCell>
                                    <Badge variant={user.active ? "default" : "secondary"} className={user.active ? "bg-green-100 text-green-700" : ""}>
                                        {user.active ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
