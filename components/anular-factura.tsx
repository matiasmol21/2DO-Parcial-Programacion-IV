"use client";
import { anularFacturaAction } from "@/app/actions/facturas";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AnularFactura({ id }: { id: number }) {
  const [error, setError] = useState(""),
    [cargando, setCargando] = useState(false);
  const router = useRouter();
  async function anular() {
    const motivo = window.prompt(
      "Ingresá el motivo de anulación de la factura:",
    );
    if (motivo === null) return;
    if (!motivo.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }
    if (
      !window.confirm(
        "¿Confirmás la anulación? Esta operación no se puede deshacer.",
      )
    )
      return;
    setCargando(true);
    setError("");
    try {
      const resultado = await anularFacturaAction(id, { motivo });
      if (!resultado.ok) {
        throw new Error(resultado.error.message || "No se pudo anular");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setCargando(false);
    }
  }
  return (
    <div>
      <Button
        variant="plain"
        size="plain"
        disabled={cargando}
        onClick={anular}
        className="text-red-700 px-3 font-semibold"
      >
        {cargando ? "Anulando…" : "Anular factura"}
      </Button>
      {error && (
        <p role="alert" className="text-red-700 text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
