import { ApiError } from "@/lib/errors";

// Serializa las operaciones locales para no iniciar varias escrituras a la vez.
let turnoActual: Promise<void> = Promise.resolve();

function esBloqueoSQLite(error: unknown): boolean {
  let errorActual: unknown = error;

  for (let nivel = 0; nivel < 6 && errorActual; nivel += 1) {
    if (typeof errorActual === "object" && "code" in errorActual) {
      const codigo = String((errorActual as { code: unknown }).code);
      if (codigo === "SQLITE_BUSY" || codigo === "SQLITE_LOCKED") {
        return true;
      }
    }

    errorActual =
      typeof errorActual === "object" && "cause" in errorActual
        ? (errorActual as { cause: unknown }).cause
        : null;
  }

  return false;
}

// Un bloqueo de SQLite hace que se repita toda la transacción y sus lecturas.
export async function conReintento<T>(operacion: () => Promise<T>): Promise<T> {
  const turnoAnterior = turnoActual;
  let liberarTurno!: () => void;
  turnoActual = new Promise((resolver) => {
    liberarTurno = resolver;
  });
  await turnoAnterior;

  try {
    for (let intento = 0; ; intento += 1) {
      try {
        return await operacion();
      } catch (error) {
        if (!esBloqueoSQLite(error)) {
          throw error;
        }
        if (intento >= 6) {
          throw new ApiError(
            503,
            "BASE_OCUPADA",
            "La base está ocupada. Reintentá la operación.",
          );
        }

        const esperaMilisegundos = 30 * 2 ** intento;
        await new Promise((resolver) =>
          setTimeout(resolver, esperaMilisegundos),
        );
      }
    }
  } finally {
    liberarTurno();
  }
}
