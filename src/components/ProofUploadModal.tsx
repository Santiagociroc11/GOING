"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: (proofUrl: string) => Promise<void>;
};

export function ProofUploadModal({ open, onOpenChange, title, description, onConfirm }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
            return;
        }
        if (f.size > 5 * 1024 * 1024) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleConfirm = async () => {
        if (!file) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("prefix", "proofs");
            setUploading(true);
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            setUploading(false);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al subir");
            await onConfirm(data.url);
            onOpenChange(false);
            reset();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Error al subir");
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleOpenChange = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {!preview ? (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
                        >
                            <Camera className="h-12 w-12 text-gray-400" />
                            <span className="text-sm text-gray-600">Toca para tomar o seleccionar foto</span>
                            <span className="text-xs text-gray-400">JPEG, PNG o WebP · máx 5MB</span>
                        </button>
                    ) : (
                        <div className="relative">
                            <img src={preview} alt="Vista previa" className="w-full h-48 object-cover rounded-xl" />
                            <Button
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
                            >
                                Cambiar
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!file || uploading || submitting}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {(uploading || submitting) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {uploading ? "Subiendo..." : submitting ? "Guardando..." : "Confirmar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
