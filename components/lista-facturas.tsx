"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fecha, moneda } from "@/lib/formato";
type Factura = {
  id: number;
  numeroFormateado: string;
  fecha: string;
  cliente: string | null;
  vendedor: string;
  total: number;
  formaPago: string;
  estado: string;
};
type Lista = {
  data: Factura[];
  page: number;
  pageSize: number;
  total: number;
  totalEmitido: number;
};
export default function ListaFacturas() {
  const [lista, setLista] = useState<Lista | null>(null),
    [error, setError] = useState(""),
    [q, setQ] = useState(""),
    [vendedor, setVendedor] = useState(""),
    [desde, setDesde] = useState(""),
    [hasta, setHasta] = useState(""),
    [forma, setForma] = useState(""),
    [estado, setEstado] = useState(""),
    [pagina, setPagina] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      const p = new URLSearchParams({
        q,
        vendedor,
        desde,
        hasta,
        forma,
        estado,
        page: String(pagina),
      });
      fetch(`/api/facturas?${p}`)
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error?.message);
          setLista(d);
          setError("");
        })
        .catch((e) =>
          setError(e.message || "No se pudieron cargar las facturas"),
        );
    }, 200);
    return () => clearTimeout(timer);
  }, [q, vendedor, desde, hasta, forma, estado, pagina]);
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <p className="text-sm text-emerald-700 font-semibold">COMPROBANTES</p>
          <h1 className="text-3xl font-semibold mt-2">Ventas</h1>
          <p className="muted mt-2">Consultá las facturas emitidas.</p>
        </div>
        <Link className="button" href="/ventas/nueva">
          + Nueva venta
        </Link>
      </div>
      <div className="panel p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
        <label className="text-sm">
          Número o cliente
          <Input
            className="mt-1"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label className="text-sm">
          Vendedor
          <Input
            className="mt-1"
            value={vendedor}
            onChange={(e) => {
              setVendedor(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label className="text-sm">
          Desde
          <Input
            className="mt-1"
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label className="text-sm">
          Hasta
          <Input
            className="mt-1"
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label className="text-sm">
          Pago
          <NativeSelect
            className="mt-1"
            value={forma}
            onChange={(e) => {
              setForma(e.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos</option>
            <option value="contado">Contado</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="cuenta_corriente">Cuenta corriente</option>
          </NativeSelect>
        </label>
        <label className="text-sm">
          Estado
          <NativeSelect
            className="mt-1"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos</option>
            <option value="emitida">Emitida</option>
            <option value="anulada">Anulada</option>
          </NativeSelect>
        </label>
      </div>
      <div className="panel mt-5 overflow-hidden">
        {error ? (
          <p role="alert" className="p-6 text-red-700">
            {error}
          </p>
        ) : !lista ? (
          <p className="p-6 muted">Cargando facturas…</p>
        ) : lista.data.length === 0 ? (
          <p className="p-6 muted">No hay facturas para mostrar.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Pago</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.data.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <Link
                          className="font-semibold text-emerald-800"
                          href={`/ventas/${f.id}`}
                        >
                          {f.numeroFormateado}
                        </Link>
                      </td>
                      <td>{fecha(f.fecha)}</td>
                      <td>{f.cliente || "Consumidor final"}</td>
                      <td>{f.formaPago.replace("_", " ")}</td>
                      <td>{moneda(f.total)}</td>
                      <td>{f.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 flex flex-wrap justify-between gap-3 text-sm">
              <span>
                {lista.total} facturas · Total emitido{" "}
                {moneda(lista.totalEmitido)}
              </span>
              <div className="flex gap-4">
                <Button
                  variant="plain"
                  size="plain"
                  disabled={pagina <= 1}
                  className="disabled:opacity-40"
                  onClick={() => setPagina(pagina - 1)}
                >
                  Anterior
                </Button>
                <span>{pagina}</span>
                <Button
                  variant="plain"
                  size="plain"
                  disabled={pagina * lista.pageSize >= lista.total}
                  className="disabled:opacity-40"
                  onClick={() => setPagina(pagina + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
