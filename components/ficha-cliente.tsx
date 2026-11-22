"use client";
import {
  editarClienteAction,
  registrarPagoAction,
} from "@/app/actions/clientes";
import { mostrarErrores, mostrarErrorApi } from "@/lib/errores-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fecha, moneda } from "@/lib/formato";
import { editarClienteSchema, pagoSchema } from "@/lib/schemas/clientes";
type Cliente = {
  id: number;
  nombre: string;
  tipoDoc: string;
  nroDoc: string;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  cuentaCorriente: boolean;
  limiteCredito: number | null;
  saldo: number;
  activo: boolean;
  ultimasFacturas: {
    id: number;
    numero: number;
    puntoVenta: number;
    creado: string;
    total: number;
    estado: string;
  }[];
};
type Movimiento = {
  id: number;
  fecha: string;
  tipo: string;
  importe: number;
  descripcion: string;
  saldo: number;
  pagoId: number | null;
};
type Cuenta = { movimientos: Movimiento[]; saldo: number };
export default function FichaCliente({ id }: { id: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null),
    [cuenta, setCuenta] = useState<Cuenta | null>(null),
    [error, setError] = useState(""),
    [aviso, setAviso] = useState(""),
    [pagando, setPagando] = useState(false),
    [guardando, setGuardando] = useState(false),
    [editando, setEditando] = useState(false);
  const cargar = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/clientes/${id}`),
        fetch(`/api/clientes/${id}/cuenta`),
      ]);
      const c = await a.json(),
        m = await b.json();
      if (!a.ok || !b.ok)
        throw new Error(
          c.error?.message || m.error?.message || "No se pudo cargar la ficha",
        );
      setCliente(c);
      setCuenta(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }, [id]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  async function pagar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAviso("");
    const form = e.currentTarget,
      f = new FormData(form),
      valor = String(f.get("importe")).replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(valor)) {
      setError("Ingresá un importe válido con hasta dos decimales.");
      return;
    }
    const datos = {
      importe: Math.round(Number(valor) * 100),
      medio: f.get("medio"),
      observacion: f.get("observacion"),
    };
    const validacion = pagoSchema.safeParse(datos);
    if (!validacion.success) {
      mostrarErrores(e.currentTarget, validacion.error.issues, {
        limiteCredito: "limite",
      });
      setError(validacion.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      const resultado = await registrarPagoAction(Number(id), validacion.data);
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error);
        throw new Error(
          resultado.error.message || "No se pudo registrar el pago",
        );
      }
      setPagando(false);
      setAviso(`Pago registrado. Recibo ${resultado.data.numeroRecibo}.`);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }
  async function editar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAviso("");
    const form = e.currentTarget,
      f = new FormData(form),
      limite = String(f.get("limite") || "").replace(",", ".");
    if (limite && !/^\d+(\.\d{1,2})?$/.test(limite)) {
      setError("Ingresá un límite válido.");
      return;
    }
    const datos = {
      tipoDoc: f.get("tipoDoc"),
      nroDoc: f.get("nroDoc"),
      nombre: f.get("nombre"),
      telefono: f.get("telefono"),
      domicilio: f.get("domicilio"),
      email: f.get("email"),
      cuentaCorriente: f.get("cuentaCorriente") === "on",
      limiteCredito: limite ? Math.round(Number(limite) * 100) : null,
    };
    const validacion = editarClienteSchema.safeParse(datos);
    if (!validacion.success) {
      mostrarErrores(e.currentTarget, validacion.error.issues, {
        limiteCredito: "limite",
      });
      setError(validacion.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      const resultado = await editarClienteAction(
        Number(id),
        validacion.data,
      );
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error, { limiteCredito: "limite" });
        throw new Error(
          resultado.error.message || "No se pudo actualizar el cliente",
        );
      }
      setEditando(false);
      setAviso("Datos actualizados.");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }
  async function desactivar() {
    if (
      !window.confirm("¿Dar de baja este cliente? El historial se conservará.")
    )
      return;
    setError("");
    try {
      const resultado = await editarClienteAction(Number(id), {
        activo: false,
      });
      if (!resultado.ok) {
        throw new Error(resultado.error.message || "No se pudo dar de baja");
      }
      setAviso("Cliente dado de baja.");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }
  return (
    <>
      <Link href="/clientes" className="text-sm text-emerald-800 font-semibold">
        ← Volver a clientes
      </Link>
      {error && (
        <p role="alert" className="mt-5 text-red-700">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-5 text-emerald-800">
          {aviso}
        </p>
      )}
      {!cliente ? (
        !error && <p className="mt-6 muted">Cargando ficha…</p>
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-4 items-end mt-6">
            <div>
              <p className="text-sm text-emerald-700 font-semibold">
                FICHA DE CLIENTE
              </p>
              <h1 className="text-3xl font-semibold mt-2">{cliente.nombre}</h1>
              <p className="muted mt-2">
                {cliente.tipoDoc} {cliente.nroDoc} ·{" "}
                {cliente.activo ? "Activo" : "Inactivo"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="plain"
                size="plain"
                className="button"
                onClick={() => setEditando(!editando)}
              >
                {editando ? "Cerrar" : "Editar datos"}
              </Button>
              {cliente.activo && (
                <Button
                  variant="plain"
                  size="plain"
                  className="px-3 text-red-700 text-sm font-semibold"
                  onClick={desactivar}
                >
                  Dar de baja
                </Button>
              )}
            </div>
          </div>
          {editando && (
            <form onSubmit={editar} className="panel p-6 mt-6">
              <h2 className="font-semibold mb-4">Editar cliente</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-sm font-semibold">
                  Tipo de documento
                  <NativeSelect
                    name="tipoDoc"
                    defaultValue={cliente.tipoDoc}
                    className="mt-2"
                  >
                    <option>DNI</option>
                    <option>CUIT</option>
                  </NativeSelect>
                </label>
                <label className="text-sm font-semibold">
                  Documento
                  <Input
                    name="nroDoc"
                    defaultValue={cliente.nroDoc}
                    className="mt-2"
                    required
                  />
                </label>
                {[
                  ["nombre", "Nombre", cliente.nombre],
                  ["domicilio", "Domicilio", cliente.domicilio || ""],
                  ["telefono", "Teléfono", cliente.telefono || ""],
                  ["email", "Correo electrónico", cliente.email || ""],
                  [
                    "limite",
                    "Límite de crédito en pesos",
                    cliente.limiteCredito === null
                      ? ""
                      : String(cliente.limiteCredito / 100),
                  ],
                ].map(([nombre, label, valor]) => (
                  <label className="text-sm font-semibold" key={nombre}>
                    {label}
                    <Input
                      name={nombre}
                      defaultValue={valor}
                      className="mt-2"
                      required={nombre === "nombre"}
                    />
                  </label>
                ))}
              </div>
              <label className="flex gap-2 items-center mt-4 text-sm">
                <Input
                  type="checkbox"
                  name="cuentaCorriente"
                  className="!w-auto"
                  defaultChecked={cliente.cuentaCorriente}
                />{" "}
                Cuenta corriente habilitada
              </label>
              <Button
                variant="plain"
                size="plain"
                className="button mt-4"
                disabled={guardando}
              >
                Guardar cambios
              </Button>
            </form>
          )}
          <div className="grid md:grid-cols-3 gap-4 mt-7">
            <div className="panel p-5">
              <p className="muted text-sm">Saldo adeudado</p>
              <p className="text-2xl font-semibold mt-2">
                {moneda(cliente.saldo)}
              </p>
            </div>
            <div className="panel p-5">
              <p className="muted text-sm">Cuenta corriente</p>
              <p className="font-semibold mt-3">
                {cliente.cuentaCorriente ? "Habilitada" : "No habilitada"}
              </p>
            </div>
            <div className="panel p-5">
              <p className="muted text-sm">Límite de crédito</p>
              <p className="font-semibold mt-3">
                {cliente.limiteCredito === null
                  ? "Sin límite"
                  : moneda(cliente.limiteCredito)}
              </p>
            </div>
          </div>
          <div className="panel p-5 mt-5">
            <h2 className="font-semibold">Datos de contacto</h2>
            <p className="muted text-sm mt-3">
              {[cliente.domicilio, cliente.telefono, cliente.email]
                .filter(Boolean)
                .join(" · ") || "No hay datos de contacto cargados."}
            </p>
          </div>
          <div className="panel p-5 mt-5">
            <h2 className="font-semibold">Últimas facturas</h2>
            {cliente.ultimasFacturas.length === 0 ? (
              <p className="muted text-sm mt-3">
                No hay facturas para este cliente.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {cliente.ultimasFacturas.map((f) => (
                  <li key={f.id}>
                    <Link
                      className="text-emerald-800 underline"
                      href={`/ventas/${f.id}`}
                    >
                      {String(f.puntoVenta).padStart(4, "0")}-
                      {String(f.numero).padStart(8, "0")}
                    </Link>{" "}
                    · {fecha(f.creado)} · {moneda(f.total)} · {f.estado}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel mt-5 overflow-hidden">
            <div className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">Movimientos de cuenta</h2>
                <p className="muted text-sm mt-1">
                  Ventas, pagos y anulaciones en orden cronológico.
                </p>
              </div>
              {cliente.activo && cliente.cuentaCorriente && (
                <Button
                  variant="plain"
                  size="plain"
                  className="button"
                  onClick={() => setPagando(!pagando)}
                >
                  {pagando ? "Cerrar" : "Registrar pago"}
                </Button>
              )}
            </div>
            {pagando && (
              <form onSubmit={pagar} className="p-5 border-t border-[#edf1ee]">
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className="text-sm font-semibold">
                    Importe en pesos
                    <Input
                      name="importe"
                      inputMode="decimal"
                      className="mt-2"
                      required
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Medio
                    <NativeSelect name="medio" className="mt-2">
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta_debito">Tarjeta de débito</option>
                    </NativeSelect>
                  </label>
                  <label className="text-sm font-semibold">
                    Observación
                    <Input name="observacion" className="mt-2" />
                  </label>
                </div>
                <Button
                  variant="plain"
                  size="plain"
                  className="button mt-4"
                  disabled={guardando}
                >
                  Confirmar pago
                </Button>
              </form>
            )}
            {!cuenta ? (
              <p className="p-5 muted">Cargando movimientos…</p>
            ) : cuenta.movimientos.length === 0 ? (
              <p className="p-5 muted border-t border-[#edf1ee]">
                Todavía no hay movimientos en la cuenta.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Tipo</th>
                      <th>Importe</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuenta.movimientos.map((m) => (
                      <tr key={m.id}>
                        <td>{fecha(m.fecha)}</td>
                        <td>
                          {m.pagoId ? (
                            <Link
                              className="text-emerald-800 underline"
                              href={`/pagos/${m.pagoId}`}
                            >
                              {m.descripcion}
                            </Link>
                          ) : (
                            m.descripcion
                          )}
                        </td>
                        <td>{m.tipo === "debito" ? "Débito" : "Crédito"}</td>
                        <td>{moneda(m.importe)}</td>
                        <td>{moneda(m.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
