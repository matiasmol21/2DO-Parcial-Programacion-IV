"use client";
import { crearClienteAction } from "@/app/actions/clientes";
import { mostrarErrores, mostrarErrorApi } from "@/lib/errores-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import { useState } from "react";
import { clienteSchema } from "@/lib/schemas/clientes";
type Cliente = {
  id: number;
  nombre: string;
  nroDoc: string;
  cuentaCorriente: boolean;
};
export default function AltaRapida({
  onCrear,
  onCerrar,
}: {
  onCrear: (cliente: Cliente) => void;
  onCerrar: () => void;
}) {
  const [error, setError] = useState(""),
    [guardando, setGuardando] = useState(false);
  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget,
      f = new FormData(form);
    const datos = clienteSchema.safeParse({
      tipoDoc: f.get("tipoDoc"),
      nroDoc: f.get("nroDoc"),
      nombre: f.get("nombre"),
      cuentaCorriente: f.get("cuentaCorriente") === "on",
    });
    if (!datos.success) {
      mostrarErrores(e.currentTarget, datos.error.issues);
      setError(datos.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      const resultado = await crearClienteAction(datos.data);
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error);
        throw new Error(
          resultado.error.message || "No se pudo crear el cliente",
        );
      }
      onCrear(resultado.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }
  return (
    <div
      className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cliente-rapido"
        className="panel p-6 w-full max-w-md"
      >
        <div className="flex justify-between">
          <h2 id="titulo-cliente-rapido" className="text-lg font-semibold">
            Nuevo cliente
          </h2>
          <Button
            variant="plain"
            size="plain"
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ✕
          </Button>
        </div>
        <form onSubmit={crear} className="space-y-4 mt-4">
          <label className="block text-sm">
            Tipo de documento
            <NativeSelect className="mt-1" name="tipoDoc">
              <option>DNI</option>
              <option>CUIT</option>
            </NativeSelect>
          </label>
          <label className="block text-sm">
            Documento
            <Input className="mt-1" name="nroDoc" required />
          </label>
          <label className="block text-sm">
            Nombre
            <Input className="mt-1" name="nombre" required />
          </label>
          <label className="flex gap-2 text-sm">
            <Input className="!w-auto" type="checkbox" name="cuentaCorriente" />{" "}
            Habilitar cuenta corriente
          </label>
          {error && (
            <p role="alert" className="text-red-700 text-sm">
              {error}
            </p>
          )}
          <Button
            variant="plain"
            size="plain"
            className="button"
            disabled={guardando}
          >
            {guardando ? "Guardando…" : "Crear y seleccionar"}
          </Button>
        </form>
      </section>
    </div>
  );
}
