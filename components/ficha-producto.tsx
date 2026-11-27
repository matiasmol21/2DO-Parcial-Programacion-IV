"use client";
import {
  editarProductoAction,
  registrarMovimientoAction,
} from "@/app/actions/productos";
import { mostrarErrores, mostrarErrorApi } from "@/lib/errores-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { fecha, moneda } from "@/lib/formato";
import { edicionProductoSchema } from "@/lib/schemas/productos";
type Producto = {
  id: number;
  codigo: string;
  descripcion: string;
  categoriaId: number;
  categoria: { id: number; nombre: string };
  precio: number;
  existencia: number;
  stockMinimo: number;
  activo: boolean;
};
type Movimiento = {
  id: number;
  fecha: string;
  tipo: string;
  cantidad: number;
  existenciaResultante: number;
  motivo: string;
  usuario: { id: number; nombre: string };
  facturaId: number | null;
};
type ListaMovimientos = {
  data: Movimiento[];
  total: number;
  page: number;
  pageSize: number;
};

type Propiedades = {
  id: string;
  admin: boolean;
  producto: Producto;
  movimientos: ListaMovimientos;
  categorias: { id: number; nombre: string }[];
  pagina: number;
};

export default function FichaProducto({
  id,
  admin,
  producto,
  movimientos,
  categorias,
  pagina,
}: Propiedades) {
  const router = useRouter();
  const parametrosActuales = useSearchParams().toString();
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function cambiarPagina(nuevaPagina: number) {
    const parametros = new URLSearchParams(parametrosActuales);
    parametros.set("page", String(nuevaPagina));
    router.push(`?${parametros.toString()}`);
  }

  async function mover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAviso("");
    const form = e.currentTarget,
      f = new FormData(form);
    setGuardando(true);
    try {
      const resultado = await registrarMovimientoAction({
        productoId: Number(id),
        tipo: f.get("tipo"),
        cantidad: Number(f.get("cantidad")),
        motivo: f.get("motivo"),
      });
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error);
        throw new Error(
          resultado.error.message || "No se pudo registrar el movimiento",
        );
      }
      setMostrar(false);
      setAviso("Movimiento registrado.");
      router.refresh();
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
      precio = String(f.get("precio")).replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
      setError("Ingresá un precio válido.");
      return;
    }
    const datos = edicionProductoSchema.safeParse({
      codigo: f.get("codigo"),
      descripcion: f.get("descripcion"),
      precio: Math.round(Number(precio) * 100),
      ...(producto.activo
        ? { existencia: Number(f.get("existencia")) }
        : {}),
      stockMinimo: Number(f.get("stockMinimo")),
      categoriaId: Number(f.get("categoriaId")),
    });
    if (!datos.success) {
      mostrarErrores(e.currentTarget, datos.error.issues);
      setError(datos.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      const resultado = await editarProductoAction(Number(id), datos.data);
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error);
        throw new Error(
          resultado.error.message || "No se pudo guardar el producto",
        );
      }
      setEditando(false);
      setAviso("Producto actualizado.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }
  async function baja() {
    if (
      !window.confirm("¿Dar de baja este producto? Se conservará su historial.")
    )
      return;
    setError("");
    try {
      const resultado = await editarProductoAction(Number(id), {
        activo: false,
      });
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }
      setAviso("Producto dado de baja.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }
  return (
    <>
      <Link
        href="/productos"
        className="text-emerald-800 text-sm font-semibold"
      >
        ← Volver al catálogo
      </Link>
      {error && (
        <p role="alert" className="text-red-700 mt-5">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="text-emerald-800 mt-5">
          {aviso}
        </p>
      )}
      {!producto ? (
        !error && <p className="muted mt-6">Cargando producto…</p>
      ) : (
        <>
          <div className="flex justify-between items-end flex-wrap gap-4 mt-6">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                FICHA DE PRODUCTO
              </p>
              <h1 className="text-3xl font-semibold mt-2">
                {producto.descripcion}
              </h1>
              <p className="muted mt-2">
                {producto.codigo} · {producto.categoria.nombre} ·{" "}
                {producto.activo ? "Activo" : "Inactivo"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {admin && (
                <Button
                  variant="plain"
                  size="plain"
                  className="button"
                  onClick={() => setEditando(!editando)}
                >
                  {editando ? "Cerrar" : "Editar producto"}
                </Button>
              )}
              {admin && producto.activo && (
                <Button
                  variant="plain"
                  size="plain"
                  className="text-red-700 text-sm font-semibold px-3"
                  onClick={baja}
                >
                  Dar de baja
                </Button>
              )}
            </div>
          </div>
          {editando && (
            <form onSubmit={editar} className="panel p-6 mt-6">
              <h2 className="font-semibold mb-4">Editar producto</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["codigo", "Código", producto.codigo],
                  ["descripcion", "Descripción", producto.descripcion],
                  ["precio", "Precio en pesos", String(producto.precio / 100)],
                  ["stockMinimo", "Stock mínimo", String(producto.stockMinimo)],
                ].map(([nombre, label, valor]) => (
                  <label key={nombre} className="text-sm font-semibold">
                    {label}
                    <Input
                      name={nombre}
                      defaultValue={valor}
                      className="mt-2"
                      required
                    />
                  </label>
                ))}
                {producto.activo && (
                  <label className="text-sm font-semibold">
                    Existencia actual
                    <Input
                      name="existencia"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={producto.existencia}
                      className="mt-2"
                      required
                    />
                  </label>
                )}
                <label className="text-sm font-semibold">
                  Categoría
                  <NativeSelect
                    name="categoriaId"
                    defaultValue={producto.categoriaId}
                    className="mt-2"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
              </div>
              <p className="muted mt-3 text-sm">
                {producto.activo
                  ? "Los cambios de existencia quedan registrados en el historial de stock."
                  : "El producto está inactivo; su existencia no se ajusta desde esta ficha."}
              </p>
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
          <div className="grid sm:grid-cols-3 gap-4 mt-7">
            <div className="panel p-5">
              <p className="muted text-sm">Existencia</p>
              <p className="text-3xl font-semibold mt-2">
                {producto.existencia}
              </p>
            </div>
            <div className="panel p-5">
              <p className="muted text-sm">Precio de venta</p>
              <p className="text-2xl font-semibold mt-2">
                {moneda(producto.precio)}
              </p>
            </div>
            <div className="panel p-5">
              <p className="muted text-sm">Stock mínimo</p>
              <p className="text-3xl font-semibold mt-2">
                {producto.stockMinimo}
              </p>
            </div>
          </div>
          <div className="panel mt-5 overflow-hidden">
            <div className="p-5 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="font-semibold text-lg">Movimientos de stock</h2>
                <p className="muted text-sm mt-1">
                  Cada ingreso y egreso queda registrado.
                </p>
              </div>
              {admin && producto.activo && (
                <Button
                  variant="plain"
                  size="plain"
                  className="button"
                  onClick={() => setMostrar(!mostrar)}
                >
                  {mostrar ? "Cerrar" : "Registrar movimiento"}
                </Button>
              )}
            </div>
            {mostrar && (
              <form onSubmit={mover} className="p-5 border-t border-[#edf1ee]">
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className="text-sm font-semibold">
                    Tipo
                    <NativeSelect name="tipo" className="mt-2">
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </NativeSelect>
                  </label>
                  <label className="text-sm font-semibold">
                    Cantidad
                    <Input
                      name="cantidad"
                      type="number"
                      min="1"
                      step="1"
                      className="mt-2"
                      required
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Motivo
                    <Input name="motivo" className="mt-2" required />
                  </label>
                </div>
                <Button
                  variant="plain"
                  size="plain"
                  className="button mt-4"
                  disabled={guardando}
                >
                  Registrar
                </Button>
              </form>
            )}
            {movimientos.data.length === 0 ? (
              <p className="p-5 muted border-t border-[#edf1ee]">
                No hay movimientos.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Existencia</th>
                      <th>Motivo</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.data.map((m) => (
                      <tr key={m.id}>
                        <td>{fecha(m.fecha)}</td>
                        <td>{m.tipo}</td>
                        <td>
                          {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                        </td>
                        <td>{m.existenciaResultante}</td>
                        <td>
                          {m.facturaId ? (
                            <Link
                              className="text-emerald-800 underline"
                              href={`/ventas/${m.facturaId}`}
                            >
                              {m.motivo}
                            </Link>
                          ) : (
                            m.motivo
                          )}
                        </td>
                        <td>{m.usuario.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 flex gap-4 text-sm">
                  <Button
                    variant="plain"
                    size="plain"
                    disabled={pagina <= 1}
                    onClick={() => cambiarPagina(pagina - 1)}
                    className="disabled:opacity-40"
                  >
                    Anterior
                  </Button>
                  <span>Página {pagina}</span>
                  <Button
                    variant="plain"
                    size="plain"
                    disabled={
                      pagina * movimientos.pageSize >= movimientos.total
                    }
                    onClick={() => cambiarPagina(pagina + 1)}
                    className="disabled:opacity-40"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
