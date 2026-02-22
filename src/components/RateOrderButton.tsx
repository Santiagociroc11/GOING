"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { mutateWithToast, toast } from "@/lib/toast";

type Props = {
    orderId: string;
    targetName: string;
    rated?: boolean;
    onRated?: () => void;
};

export function RateOrderButton({ orderId, targetName, rated, onRated }: Props) {
    const [open, setOpen] = useState(false);
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (score < 1) {
            toast.error("Selecciona una puntuación");
            return;
        }
        setLoading(true);
        const { ok } = await mutateWithToast(`/api/orders/${orderId}/rate`, {
            method: "POST",
            body: { score, comment: comment || undefined },
        });
        setLoading(false);
        if (ok) {
            toast.success("¡Gracias por tu calificación!");
            setOpen(false);
            onRated?.();
        }
    };

    if (rated) return <span className="text-xs text-emerald-600">Calificado</span>;

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
                <Star className="h-4 w-4" />
                Calificar
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Calificar a {targetName}</DialogTitle>
                        <DialogDescription>¿Cómo fue tu experiencia con este pedido?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-1 justify-center">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onMouseEnter={() => setHoverScore(s)}
                                    onMouseLeave={() => setHoverScore(0)}
                                    onClick={() => setScore(s)}
                                    className="p-1"
                                >
                                    <Star
                                        className={`h-10 w-10 transition-colors ${
                                            (hoverScore || score) >= s ? "fill-amber-400 text-amber-400" : "text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Comentario opcional"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full min-h-[80px] px-3 py-2 border rounded-lg text-sm"
                            maxLength={500}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={loading || score < 1} className="bg-orange-600 hover:bg-orange-700">
                            Enviar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
