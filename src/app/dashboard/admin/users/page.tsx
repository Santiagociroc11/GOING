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
import { RefreshCcw, UserPlus, Users, UserCog, Wallet, Pencil, MoreVertical, UserX, UserCheck } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    city: string;
    active: boolean;
    balance?: number;
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

    const [rechargeUserId, setRechargeUserId] = useState<string | null>(null);
    const [rechargeAmount, setRechargeAmount] = useState("");
    const [rechargeNote, setRechargeNote] = useState("");
    const [recharging, setRecharging] = useState(false);

    const [editUser, setEditUser] = useState<User | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState<"BUSINESS" | "DRIVER" | "ADMIN">("BUSINESS");
    const [editCity, setEditCity] = useState("");
    const [editActive, setEditActive] = useState(true);
    const [editCompanyName, setEditCompanyName] = useState("");
    const [editVehicleType, setEditVehicleType] = useState("");
    const [editLicensePlate, setEditLicensePlate] = useState("");
    const [editStorePlainPassword, setEditStorePlainPassword] = useState(false);
    const [updating, setUpdating] = useState(false);

    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    const handleRecharge = async () => {
        if (!rechargeUserId || !rechargeAmount.trim()) {
            toast.error("Ingresa el monto a recargar");
            return;
        }
        const amount = parseFloat(rechargeAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("El monto debe ser mayor a 0");
            return;
        }
        setRecharging(true);
        const { ok } = await mutateWithToast("/api/admin/recharge", {
            method: "POST",
            body: { businessId: rechargeUserId, amount, note: rechargeNote.trim() || undefined },
        });
        setRecharging(false);
        if (ok) {
            setRechargeUserId(null);
            setRechargeAmount("");
            setRechargeNote("");
            fetchUsers();
        }
    };

    const handleImpersonate = async (userId: string) => {
        const res = await fetch("/api/admin/impersonate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        if (res.ok) {
            window.location.href = "/dashboard";
        } else {
            toast.error("No se pudo suplantar al usuario");
        }
    };

    const openRechargeDialog = (user: User) => {
        setRechargeUserId(user._id);
        setRechargeAmount("");
        setRechargeNote("");
    };

    const openEditDialog = (user: User) => {
        setEditUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPassword("");
        setEditRole(user.role as "BUSINESS" | "DRIVER" | "ADMIN");
        setEditCity(user.city);
        setEditActive(user.active);
        setEditCompanyName(user.businessDetails?.companyName ?? "");
        setEditVehicleType(user.driverDetails?.vehicleType ?? "");
        setEditLicensePlate(user.driverDetails?.licensePlate ?? "");
        setEditStorePlainPassword(false);
    };

    const handleUpdateUser = async () => {
        if (!editUser) return;
        if (!editName.trim() || !editEmail.trim() || !editCity.trim()) {
            toast.error("Completa nombre, email y ciudad");
            return;
        }

        setUpdating(true);
        const body: Record<string, unknown> = {
            name: editName.trim(),
            email: editEmail.trim(),
            role: editRole,
            city: editCity.trim(),
            active: editActive,
            businessDetails: editRole === "BUSINESS" ? { companyName: editCompanyName || undefined } : undefined,
            driverDetails: editRole === "DRIVER" ? { vehicleType: editVehicleType || undefined, licensePlate: editLicensePlate || undefined } : undefined,
        };
        if (editPassword.trim()) {
            body.password = editPassword;
            body.storePlainPassword = editStorePlainPassword;
        }

        const { ok, data } = await mutateWithToast(`/api/admin/users/${editUser._id}`, {
            method: "PUT",
            body,
        });
        setUpdating(false);
        if (ok) {
            setEditUser(null);
            const updated = data as User | undefined;
            if (updated) setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
            else fetchUsers();
        }
    };

    const handleToggleActive = async (user: User) => {
        const { ok, data } = await mutateWithToast(`/api/admin/users/${user._id}`, {
            method: "PUT",
            body: { active: !user.active },
        });
        const updated = data as User | undefined;
        if (ok && updated) {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, active: updated.active } : u)));
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteUser) return;

        setDeleting(true);
        const { ok } = await mutateWithToast(`/api/admin/users/${deleteUser._id}`, { method: "DELETE" });
        setDeleting(false);
        if (ok) {
            setDeleteUser(null);
            setUsers((prev) => prev.map((u) => (u._id === deleteUser._id ? { ...u, active: false } : u)));
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
                    <p className="text-gray-500">Crear, editar, activar y desactivar usuarios.</p>
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

                    <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Editar usuario</DialogTitle>
                                <DialogDescription>
                                    Modifica los datos del usuario. Deja la contraseña vacía para no cambiarla.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nombre</Label>
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" placeholder="Juan Pérez" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" placeholder="juan@ejemplo.com" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nueva contraseña</Label>
                                    <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="col-span-3" placeholder="Dejar vacío para no cambiar" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Rol</Label>
                                    <Select value={editRole} onValueChange={(v) => setEditRole(v as "BUSINESS" | "DRIVER" | "ADMIN")}>
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
                                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="col-span-3" placeholder="BOGOTA" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right col-span-1"></Label>
                                    <label className="col-span-3 flex items-center gap-2 text-sm text-gray-600">
                                        <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="rounded" />
                                        Usuario activo
                                    </label>
                                </div>
                                {editRole === "BUSINESS" && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Empresa</Label>
                                        <Input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="col-span-3" placeholder="Mi Empresa S.A.S" />
                                    </div>
                                )}
                                {editRole === "DRIVER" && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Vehículo</Label>
                                            <Select value={editVehicleType} onValueChange={setEditVehicleType}>
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
                                            <Input value={editLicensePlate} onChange={(e) => setEditLicensePlate(e.target.value)} className="col-span-3" placeholder="ABC-123" />
                                        </div>
                                    </>
                                )}
                                {editPassword && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right col-span-1"></Label>
                                        <label className="col-span-3 flex items-center gap-2 text-sm text-gray-600">
                                            <input type="checkbox" checked={editStorePlainPassword} onChange={(e) => setEditStorePlainPassword(e.target.checked)} className="rounded" />
                                            Guardar contraseña en texto plano
                                        </label>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                                <Button onClick={handleUpdateUser} disabled={updating} className="bg-orange-600 hover:bg-orange-700">
                                    {updating ? "Guardando..." : "Guardar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Desactivar usuario</DialogTitle>
                                <DialogDescription>
                                    {deleteUser && (
                                        <>¿Desactivar a <strong>{deleteUser.name}</strong>? No podrá iniciar sesión hasta que lo reactives desde Editar.</>
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancelar</Button>
                                <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
                                    {deleting ? "Desactivando..." : "Desactivar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={!!rechargeUserId} onOpenChange={(open) => { if (!open) setRechargeUserId(null); }}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Recargar saldo</DialogTitle>
                                <DialogDescription>
                                    Recarga saldo al negocio para que pueda crear pedidos. El sistema funciona prepago.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Monto ($)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={rechargeAmount}
                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Ej: 50000"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nota</Label>
                                    <Input
                                        value={rechargeNote}
                                        onChange={(e) => setRechargeNote(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRechargeUserId(null)}>Cancelar</Button>
                                <Button onClick={handleRecharge} disabled={recharging} className="bg-emerald-600 hover:bg-emerald-700">
                                    {recharging ? "Recargando..." : "Recargar"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md bg-white shadow-sm overflow-hidden">
                <div className="md:hidden divide-y">
                    {users.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500 text-sm">No hay usuarios registrados.</div>
                    )}
                    {users.map((user) => (
                        <div key={user._id} className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-gray-900">{user.name}</p>
                                {getRoleBadge(user.role)}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-gray-500">{user.city}</span>
                                {(user.role === "BUSINESS" || user.role === "DRIVER") && (
                                    <span className="text-sm font-semibold text-emerald-600">${(user.balance ?? 0).toLocaleString()}</span>
                                )}
                                <Badge variant={user.active ? "default" : "secondary"} className={user.active ? "bg-green-100 text-green-700 text-xs" : "text-xs"}>
                                    {user.active ? "Activo" : "Inactivo"}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(user)}
                                    className="text-gray-600 hover:text-orange-600 justify-start"
                                >
                                    <Pencil className="h-4 w-4 mr-2" /> Editar
                                </Button>
                                {user.role === "BUSINESS" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openRechargeDialog(user)}
                                        className="text-emerald-600 hover:text-emerald-700 justify-start"
                                    >
                                        <Wallet className="h-4 w-4 mr-2" /> Recargar
                                    </Button>
                                )}
                                {user.active ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteUser(user)}
                                        className="text-red-600 hover:text-red-700 justify-start"
                                    >
                                        <UserX className="h-4 w-4 mr-2" /> Desactivar
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleActive(user)}
                                        className="text-green-600 hover:text-green-700 justify-start"
                                    >
                                        <UserCheck className="h-4 w-4 mr-2" /> Activar
                                    </Button>
                                )}
                                {user.role !== "ADMIN" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleImpersonate(user._id)}
                                        className="text-orange-600 hover:text-orange-700 justify-start"
                                    >
                                        <UserCog className="h-4 w-4 mr-2" /> Suplantar
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Ciudad</TableHead>
                            <TableHead>Saldo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Registro</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-gray-500">
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
                                    {(user.role === "BUSINESS" || user.role === "DRIVER") && (
                                        <span className="font-semibold text-emerald-600">${(user.balance ?? 0).toLocaleString()}</span>
                                    )}
                                    {user.role === "ADMIN" && (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.active ? "default" : "secondary"} className={user.active ? "bg-green-100 text-green-700" : ""}>
                                        {user.active ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 items-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(user)}
                                            title="Editar"
                                            className="text-gray-600 hover:text-orange-600"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {user.role === "BUSINESS" && (
                                                    <DropdownMenuItem onClick={() => openRechargeDialog(user)}>
                                                        <Wallet className="h-4 w-4 mr-2" /> Recargar saldo
                                                    </DropdownMenuItem>
                                                )}
                                                {user.active ? (
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => setDeleteUser(user)}
                                                        className="text-red-600"
                                                    >
                                                        <UserX className="h-4 w-4 mr-2" /> Desactivar
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                                        <UserCheck className="h-4 w-4 mr-2" /> Activar
                                                    </DropdownMenuItem>
                                                )}
                                                {user.role !== "ADMIN" && (
                                                    <DropdownMenuItem onClick={() => handleImpersonate(user._id)}>
                                                        <UserCog className="h-4 w-4 mr-2" /> Suplantar
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
        </div>
    );
}
