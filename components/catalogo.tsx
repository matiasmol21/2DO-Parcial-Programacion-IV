"use client";
import { crearProductoAction } from "@/app/actions/productos";
import { mostrarErrores, mostrarErrorApi } from "@/lib/errores-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { moneda } from "@/lib/formato";
import { altaProductoSchema } from "@/lib/schemas/productos";
type Producto = {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: { id: number; nombre: string };
  precio: number;
  existencia: number;
  stockMinimo: number;
};
type Categoria = { id: number; nombre: string };
type Lista = {
  data: Producto[];
  total: number;
  page: number;
  pageSize: number;
};
type Filtros = {
  q?: string;
  categoriaId?: string;
  bajoMinimo?: string;
  page?: string;
};

type Propiedades = {
  admin: boolean;
  lista: Lista;
  categorias: Categoria[];
  filtros: Filtros;
};

export default function Catalogo({
  admin,
  lista,
  categorias,
  filtros,
}: Propiedades) {
  const router = useRouter();
  const pathname = usePathname();
  const parametrosActuales = useSearchParams().toString();
  const pagina = Math.max(
    1,
    Number.parseInt(filtros.page || "1", 10) || 1,
  );
  const [busqueda, setBusqueda] = useState(filtros.q || "");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [abierto, setAbierto] = useState(false);

  function actualizarFiltro(nombre: keyof Filtros, valor: string) {
    const parametros = new URLSearchParams(parametrosActuales);

    if (valor) {
      parametros.set(nombre, valor);
    } else {
      parametros.delete(nombre);
    }

    parametros.delete("page");
    const consulta = parametros.toString();
    router.push(consulta ? `${pathname}?${consulta}` : pathname);
  }

  function cambiarPagina(nuevaPagina: number) {
    const parametros = new URLSearchParams(parametrosActuales);
    parametros.set("page", String(nuevaPagina));
    router.push(`${pathname}?${parametros.toString()}`);
  }

  useEffect(() => {
    const busquedaActual =
      new URLSearchParams(parametrosActuales).get("q") || "";
    setBusqueda(busquedaActual);
  }, [parametrosActuales]);

  useEffect(() => {
    const busquedaActual =
      new URLSearchParams(parametrosActuales).get("q") || "";
    const busquedaNueva = busqueda.trim();

    if (busquedaNueva === busquedaActual) {
      return;
    }

    const temporizador = setTimeout(() => {
      const parametros = new URLSearchParams(parametrosActuales);

      if (busquedaNueva) {
        parametros.set("q", busquedaNueva);
      } else {
        parametros.delete("q");
      }

      parametros.delete("page");
      const consulta = parametros.toString();
      router.replace(consulta ? `${pathname}?${consulta}` : pathname);
    }, 200);

    return () => clearTimeout(temporizador);
  }, [busqueda, parametrosActuales, pathname, router]);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAviso("");
    const form = e.currentTarget,
      f = new FormData(form),
      precio = String(f.get("precio")).replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
      setError("Ingresá un precio válido con hasta dos decimales.");
      return;
    }
    const datos = altaProductoSchema.safeParse({
      codigo: f.get("codigo"),
      descripcion: f.get("descripcion"),
      categoriaId: Number(f.get("categoriaId")),
      precio: Math.round(Number(precio) * 100),
      stockMinimo: Number(f.get("stockMinimo")),
      stockInicial: Number(f.get("stockInicial")),
    });
    if (!datos.success) {
      mostrarErrores(e.currentTarget, datos.error.issues);
      setError(datos.error.issues[0].message);
      return;
    }
    try {
      const resultado = await crearProductoAction(datos.data);
      if (!resultado.ok) {
        mostrarErrorApi(form, resultado.error);
        throw new Error(resultado.error.message);
      }
      form.reset();
      setAbierto(false);
      setAviso("Producto creado correctamente.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el producto",
      );
    }
  }
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <p className="text-sm text-emerald-700 font-semibold">INVENTARIO</p>
          <h1 className="text-3xl font-semibold mt-2">Productos</h1>
          <p className="muted mt-2">
            Consultá tu catálogo.{" "}
            <Link
              href="/productos/categorias"
              className="text-emerald-800 underline"
            >
              Categorías
            </Link>
          </p>
        </div>
        {admin && (
          <Button
            variant="plain"
            size="plain"
            className="button"
            onClick={() => setAbierto(!abierto)}
          >
            {abierto ? "Cerrar" : "+ Nuevo producto"}
          </Button>
        )}
      </div>
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
      {abierto && (
        <form onSubmit={guardar} className="panel p-6 mt-6">
          <h2 className="font-semibold mb-4">Nuevo producto</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["codigo", "Código"],
              ["descripcion", "Descripción"],
              ["precio", "Precio en pesos"],
              ["stockMinimo", "Stock mínimo"],
            ].map(([name, label]) => (
              <label key={name} className="text-sm font-semibold">
                {label}
                <Input className="mt-2" name={name} required />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Stock inicial
              <Input
                name="stockInicial"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                className="mt-2"
                required
              />
            </label>
            <label className="text-sm font-semibold">
              Categoría
              <NativeSelect name="categoriaId" className="mt-2" required>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </NativeSelect>
            </label>
          </div>
          <p className="text-sm muted mt-4">
            El stock inicial queda registrado como un movimiento de ingreso.
          </p>
          <Button variant="plain" size="plain" className="button mt-4">
            Guardar producto
          </Button>
        </form>
      )}
      <div className="panel mt-7 overflow-hidden">
        <div
          className="p-4 border-b border-[#edf1ee] flex flex-wrap gap-3 items-center"
        >
          <Input
            className="!w-full sm:!w-64"
            type="search"
            placeholder="Buscar código o producto"
            aria-label="Buscar código o producto"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
          <label className="sr-only" htmlFor="filtro-categoria">
            Categoría
          </label>
          <NativeSelect
            id="filtro-categoria"
            className="!w-auto"
            value={filtros.categoriaId || ""}
            onChange={(event) =>
              actualizarFiltro("categoriaId", event.target.value)
            }
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option value={c.id} key={c.id}>
                {c.nombre}
              </option>
            ))}
          </NativeSelect>
          <label className="flex gap-2 items-center text-sm">
            <Input
              type="checkbox"
              className="!w-auto"
              checked={filtros.bajoMinimo === "true"}
              onChange={(event) =>
                actualizarFiltro(
                  "bajoMinimo",
                  event.target.checked ? "true" : "",
                )
              }
            />{" "}
            Bajo mínimo
          </label>
        </div>
        {!lista && !error ? (
          <p className="p-8 muted">Cargando productos…</p>
        ) : lista?.data.length === 0 ? (
          <p className="p-8 muted">No hay productos para mostrar.</p>
        ) : (
          lista && (
            <>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Existencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.data.map((p) => (
                      <tr key={p.id}>
                        <td>{p.codigo}</td>
                        <td>
                          <Link
                            className="text-emerald-800 font-semibold"
                            href={`/productos/${p.id}`}
                          >
                            {p.descripcion}
                          </Link>
                        </td>
                        <td>{p.categoria.nombre}</td>
                        <td>{moneda(p.precio)}</td>
                        <td>
                          {p.existencia}{" "}
                          {p.existencia < p.stockMinimo && (
                            <span className="text-amber-800 text-xs">
                              Bajo mínimo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 flex justify-between text-sm">
                <span>
                  {lista.total} productos · Página {pagina}
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
          )
        )}
      </div>
    </>
  );
}
