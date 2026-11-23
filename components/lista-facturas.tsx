"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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

type Filtros = {
  q?: string;
  vendedor?: string;
  desde?: string;
  hasta?: string;
  forma?: string;
  estado?: string;
  page?: string;
};

type Propiedades = {
  lista: Lista;
  filtros: Filtros;
};

export default function ListaFacturas({ lista, filtros }: Propiedades) {
  const router = useRouter();
  const pathname = usePathname();
  const pagina = Math.max(1, Number.parseInt(filtros.page || "1", 10) || 1);
  const [busqueda, setBusqueda] = useState(filtros.q || "");

  function crearParametrosActuales() {
    const parametros = new URLSearchParams();

    for (const [clave, contenido] of Object.entries(filtros)) {
      if (contenido && clave !== "page") {
        parametros.set(clave, contenido);
      }
    }

    return parametros;
  }

  function cambiarFiltro(nombre: keyof Filtros, valor: string) {
    const parametros = crearParametrosActuales();

    if (valor) {
      parametros.set(nombre, valor);
    } else {
      parametros.delete(nombre);
    }

    parametros.delete("page");
    const query = parametros.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function enviarBusqueda(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cambiarFiltro("q", busqueda.trim());
  }

  function cambiarPagina(nuevaPagina: number) {
    const parametros = crearParametrosActuales();
    parametros.set("page", String(nuevaPagina));
    router.push(`${pathname}?${parametros.toString()}`);
  }

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

      <form
        className="panel p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6"
        onSubmit={enviarBusqueda}
      >
        <label className="text-sm">
          Número o cliente
          <Input
            className="mt-1"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>
        <label className="text-sm">
          Vendedor
          <Input
            className="mt-1"
            defaultValue={filtros.vendedor || ""}
            onChange={(event) => cambiarFiltro("vendedor", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Desde
          <Input
            className="mt-1"
            type="date"
            defaultValue={filtros.desde || ""}
            onChange={(event) => cambiarFiltro("desde", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Hasta
          <Input
            className="mt-1"
            type="date"
            defaultValue={filtros.hasta || ""}
            onChange={(event) => cambiarFiltro("hasta", event.target.value)}
          />
        </label>
        <label className="text-sm">
          Pago
          <NativeSelect
            className="mt-1"
            value={filtros.forma || ""}
            onChange={(event) => cambiarFiltro("forma", event.target.value)}
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
            value={filtros.estado || ""}
            onChange={(event) => cambiarFiltro("estado", event.target.value)}
          >
            <option value="">Todos</option>
            <option value="emitida">Emitida</option>
            <option value="anulada">Anulada</option>
          </NativeSelect>
        </label>
        <Button type="submit" className="self-end">
          Buscar
        </Button>
      </form>

      <div className="panel mt-5 overflow-hidden">
        {lista.data.length === 0 ? (
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
                  {lista.data.map((factura) => (
                    <tr key={factura.id}>
                      <td>
                        <Link
                          className="font-semibold text-emerald-800"
                          href={`/ventas/${factura.id}`}
                        >
                          {factura.numeroFormateado}
                        </Link>
                      </td>
                      <td>{fecha(factura.fecha)}</td>
                      <td>{factura.cliente || "Consumidor final"}</td>
                      <td>{factura.formaPago.replace("_", " ")}</td>
                      <td>{moneda(factura.total)}</td>
                      <td>{factura.estado}</td>
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
                  onClick={() => cambiarPagina(pagina - 1)}
                >
                  Anterior
                </Button>
                <span>{pagina}</span>
                <Button
                  variant="plain"
                  size="plain"
                  disabled={pagina * lista.pageSize >= lista.total}
                  className="disabled:opacity-40"
                  onClick={() => cambiarPagina(pagina + 1)}
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
