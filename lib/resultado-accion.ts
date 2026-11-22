import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";

export type ErrorAccion = {
  code: string;
  message: string;
  details?: unknown;
};

export type ResultadoAccion<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorAccion };

// Las acciones devuelven errores simples que el formulario puede mostrar.
export async function ejecutarAccion<T>(
  operacion: () => Promise<T>,
): Promise<ResultadoAccion<T>> {
  try {
    return { ok: true, data: await operacion() };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: {
          code: "VALIDACION",
          message: "Revisá los datos ingresados",
          details: error.issues.map((issue) => ({
            campo: issue.path.join("."),
            mensaje: issue.message,
          })),
        },
      };
    }

    if (error instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    console.error(error);
    return {
      ok: false,
      error: {
        code: "ERROR_INTERNO",
        message: "Ocurrió un error inesperado",
      },
    };
  }
}
