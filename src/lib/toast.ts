import { toast as sonnerToast } from "sonner";

const DEFAULT_ERROR = "Ha ocurrido un error. Intenta de nuevo.";

/**
 * Toast reutilizable para el proyecto.
 * Centraliza mensajes y manejo de errores.
 */
export const toast = {
    success: (message: string) => {
        sonnerToast.success(message);
    },

    error: (message: string = DEFAULT_ERROR) => {
        sonnerToast.error(message);
    },

    warning: (message: string) => {
        sonnerToast.warning(message);
    },

    info: (message: string) => {
        sonnerToast.info(message);
    },

    loading: (message: string) => {
        return sonnerToast.loading(message);
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string | ((err: unknown) => string);
        }
    ) => {
        return sonnerToast.promise(promise, {
            loading: messages.loading,
            success: messages.success,
            error: (err) =>
                typeof messages.error === "function" ? messages.error(err) : messages.error,
        });
    },
};

/**
 * Extrae mensaje de error de una Response de fetch.
 */
export async function getErrorMessage(res: Response): Promise<string> {
    try {
        const data = await res.json();
        if (data?.message && typeof data.message === "string") {
            return data.message;
        }
    } catch {
        /* body no es JSON */
    }

    const statusMessages: Record<number, string> = {
        400: "Solicitud inválida",
        401: "No autorizado. Inicia sesión nuevamente.",
        403: "No tienes permiso para esta acción",
        404: "Recurso no encontrado",
        409: "Conflicto: el recurso ya existe",
        500: "Error del servidor. Intenta más tarde.",
    };

    return statusMessages[res.status] || DEFAULT_ERROR;
}

/**
 * Ejecuta fetch y muestra toast de error si falla.
 * Retorna { data, error }. Si error, data es null.
 */
export async function fetchWithToast<T = unknown>(
    url: string,
    options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
    try {
        const res = await fetch(url, { credentials: "include", ...options });

        if (!res.ok) {
            const message = await getErrorMessage(res);
            toast.error(message);
            return { data: null, error: message };
        }

        const data = (await res.json()) as T;
        return { data, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : DEFAULT_ERROR;
        toast.error("Error de conexión. Verifica tu internet.");
        return { data: null, error: message };
    }
}

/**
 * Ejecuta fetch con método POST/PUT/etc y muestra toast.
 * Para mutaciones (crear, actualizar, eliminar).
 */
type MutateOptions = Omit<RequestInit, "body"> & { body?: object };

export async function mutateWithToast(
    url: string,
    options: MutateOptions
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
    const { body, ...rest } = options;
    const hasBody = body !== undefined && body !== null;
    try {
        const res = await fetch(url, {
            credentials: "include",
            ...rest,
            headers: hasBody ? { "Content-Type": "application/json", ...(rest.headers as object) } : rest.headers,
            body: hasBody ? JSON.stringify(body) : undefined,
        });

        let data: unknown;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            const message =
                (data as { message?: string })?.message || (await getErrorMessage(res));
            toast.error(message);
            return { ok: false, data, error: message };
        }

        return { ok: true, data };
    } catch (err) {
        toast.error("Error de conexión. Verifica tu internet.");
        return {
            ok: false,
            error: err instanceof Error ? err.message : DEFAULT_ERROR,
        };
    }
}
