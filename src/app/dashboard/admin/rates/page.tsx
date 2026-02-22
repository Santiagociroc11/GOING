"use client";

import { useEffect, useState } from "react";
import { toast, fetchWithToast, mutateWithToast } from "@/lib/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCcw, Trash2, Pencil } from "lucide-react";

type Rate = {
    _id: string;
    city: string;
    basePrice: number;
    pricePerKm: number;
};

export default function AdminRatesPage() {
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [newCity, setNewCity] = useState("");
    const [newBasePrice, setNewBasePrice] = useState("");
    const [newPricePerKm, setNewPricePerKm] = useState("");

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<Rate | null>(null);
    const [editBasePrice, setEditBasePrice] = useState("");
    const [editPricePerKm, setEditPricePerKm] = useState("");

    const fetchRates = async () => {
        setLoading(true);
        const { data, error } = await fetchWithToast<Rate[]>("/api/admin/rates");
        if (!error && data) setRates(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleAddRate = async () => {
        const { ok } = await mutateWithToast("/api/admin/rates", {
            method: "POST",
            body: { city: newCity, basePrice: Number(newBasePrice), pricePerKm: Number(newPricePerKm) },
        });
        if (ok) {
            toast.success("Tarifa añadida exitosamente");
            setIsDialogOpen(false);
            setNewCity("");
            setNewBasePrice("");
            setNewPricePerKm("");
            fetchRates();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta tarifa?")) return;
        const { ok } = await mutateWithToast(`/api/admin/rates/${id}`, { method: "DELETE" });
        if (ok) {
            toast.success("Tarifa eliminada");
            fetchRates();
        }
    };

    const openEditDialog = (rate: Rate) => {
        setEditingRate(rate);
        setEditBasePrice(rate.basePrice.toString());
        setEditPricePerKm(rate.pricePerKm.toString());
        setEditDialogOpen(true);
    };

    const handleEditRate = async () => {
        if (!editingRate) return;
        const { ok } = await mutateWithToast(`/api/admin/rates/${editingRate._id}`, {
            method: "PATCH",
            body: { basePrice: Number(editBasePrice), pricePerKm: Number(editPricePerKm) },
        });
        if (ok) {
            toast.success("Tarifa actualizada");
            setEditDialogOpen(false);
            setEditingRate(null);
            fetchRates();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Tarifas</h2>
                    <p className="text-gray-500">Configura los precios de entrega por ciudad.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchRates} title="Refresh">
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-600 hover:bg-orange-700">Añadir Tarifa</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Añadir Nueva Tarifa</DialogTitle>
                                <DialogDescription>
                                    Ingresa los detalles de precios para una ciudad específica.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="city" className="text-right">Ciudad</Label>
                                    <Input id="city" value={newCity} onChange={(e) => setNewCity(e.target.value)} className="col-span-3" placeholder="BOGOTA" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="basePrice" className="text-right">Base ($)</Label>
                                    <Input id="basePrice" type="number" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} className="col-span-3" placeholder="10.00" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="pricePerKm" className="text-right">Por km ($)</Label>
                                    <Input id="pricePerKm" type="number" value={newPricePerKm} onChange={(e) => setNewPricePerKm(e.target.value)} className="col-span-3" placeholder="1.50" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddRate} className="bg-orange-600 hover:bg-orange-700">Guardar Cambios</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Editar Tarifa</DialogTitle>
                                <DialogDescription>
                                    Modifica los precios para {editingRate?.city}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editBasePrice" className="text-right">Base ($)</Label>
                                    <Input id="editBasePrice" type="number" value={editBasePrice} onChange={(e) => setEditBasePrice(e.target.value)} className="col-span-3" placeholder="10.00" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editPricePerKm" className="text-right">Por km ($)</Label>
                                    <Input id="editPricePerKm" type="number" value={editPricePerKm} onChange={(e) => setEditPricePerKm(e.target.value)} className="col-span-3" placeholder="1.50" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleEditRate} className="bg-orange-600 hover:bg-orange-700">Guardar Cambios</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-md bg-white shadow-sm overflow-hidden">
                <div className="md:hidden divide-y">
                    {rates.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500 text-sm">No hay tarifas configuradas.</div>
                    )}
                    {rates.map((rate) => (
                        <div key={rate._id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-900">{rate.city}</p>
                                <p className="text-sm text-gray-600">Base ${rate.basePrice.toFixed(2)} · ${rate.pricePerKm.toFixed(2)}/km</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(rate)} title="Editar" className="text-orange-600 h-9 w-9">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(rate._id)} title="Eliminar" className="text-red-500 h-9 w-9">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ciudad</TableHead>
                            <TableHead className="text-right">Precio Base</TableHead>
                            <TableHead className="text-right">Precio por Km</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No hay tarifas configuradas.
                                </TableCell>
                            </TableRow>
                        )}
                        {rates.map((rate) => (
                            <TableRow key={rate._id}>
                                <TableCell className="font-medium">{rate.city}</TableCell>
                                <TableCell className="text-right">${rate.basePrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right">${rate.pricePerKm.toFixed(2)}</TableCell>
                                <TableCell className="text-right flex gap-1 justify-end">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rate)} title="Editar" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rate._id)} title="Eliminar" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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
