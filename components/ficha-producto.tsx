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
import { useCallback, useEffect, useState } from "react";
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
export default function FichaProducto({
  id,
  admin,
}: {
  id: string;
  admin: boolean;
}) {
  const [pagina, setPagina] = useState(1),
    [totalMovimientos, setTotalMovimientos] = useState(0),
    [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>(
      [],
    );
  const [producto, setProducto] = useState<Producto | null>(null),
    [movimientos, setMovimientos] = useState<Movimiento[] | null>(null),
    [error, setError] = useState(""),
    [aviso, setAviso] = useState(""),
    [mostrar, setMostrar] = useState(false),
    [editando, setEditando] = useState(false),
    [guardando, setGuardando] = useState(false);
  const cargar = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        fetch(`/api/productos/${id}`),
        fetch(`/api/productos/${id}/movimientos?page=${pagina}`),
        fetch("/api/categorias"),
      ]);
      const p = await a.json(),
        m = await b.json(),
        categorias = await c.json();
      if (!a.ok || !b.ok || !c.ok)
        throw new Error(
          p.error?.message ||
            m.error?.message ||
            "No se pudo cargar el producto",
        );
      setProducto(p);
      setMovimientos(m.data);
      setTotalMovimientos(m.total);
      setCategorias(categorias);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }, [id, pagina]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
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
      precio = String(f.get("precio")).replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
      setError("Ingresá un precio válido.");
      return;
    }
    const datos = edicionProductoSchema.safeParse({
      codigo: f.get("codigo"),
      descripcion: f.get("descripcion"),
      precio: Math.round(Number(precio) * 100),
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
      const resultado = await editarProductoAction(
        Number(id),
        datos.data,
      );
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error);
        throw new Error(
          resultado.error.message || "No se pudo guardar el producto",
        );
      }
      setEditando(false);
      setAviso("Producto actualizado.");
      await cargar();
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
      await cargar();
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
            {!movimientos ? (
              <p className="p-5 muted">Cargando movimientos…</p>
            ) : movimientos.length === 0 ? (
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
                    {movimientos.map((m) => (
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
                    onClick={() => setPagina(pagina - 1)}
                    className="disabled:opacity-40"
                  >
                    Anterior
                  </Button>
                  <span>Página {pagina}</span>
                  <Button
                    variant="plain"
                    size="plain"
                    disabled={pagina * 20 >= totalMovimientos}
                    onClick={() => setPagina(pagina + 1)}
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
