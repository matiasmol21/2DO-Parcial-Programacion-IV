"use client";
import { crearClienteAction } from "@/app/actions/clientes";
import { mostrarErrores, mostrarErrorApi } from "@/lib/errores-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clienteSchema } from "@/lib/schemas/clientes";
import { moneda } from "@/lib/formato";
type Cliente = {
  id: number;
  tipoDoc: string;
  nroDoc: string;
  nombre: string;
  cuentaCorriente: boolean;
  saldo: number;
};
type Lista = {
  data: Cliente[];
  page: number;
  total: number;
  pageSize: number;
  totalAdeudado?: number;
};
type Filtros = {
  q?: string;
  conDeuda?: string;
  orden?: string;
  page?: string;
};

type Propiedades = {
  lista: Lista;
  filtros: Filtros;
};

export default function ListaClientes({ lista, filtros }: Propiedades) {
  const router = useRouter();
  const pathname = usePathname();
  const parametrosActuales = useSearchParams().toString();
  const pagina = Math.max(1, Number(filtros.page || 1));
  const soloDeuda = filtros.conDeuda === "true";
  const [busqueda, setBusqueda] = useState(filtros.q || "");
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  function actualizarFiltro(nombre: keyof Filtros, valor: string) {
    const parametros = new URLSearchParams(parametrosActuales);

    if (valor) {
      parametros.set(nombre, valor);
    } else {
      parametros.delete(nombre);
    }

    if (nombre === "conDeuda") {
      if (valor) {
        parametros.set("orden", "saldo");
      } else {
        parametros.delete("orden");
      }
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
    const formulario = e.currentTarget,
      f = new FormData(formulario),
      limite = String(f.get("limite") || "").replace(",", ".");
    if (limite && !/^\d+(\.\d{1,2})?$/.test(limite)) {
      setError("El límite debe ser un importe válido con hasta dos decimales.");
      return;
    }
    const datos = {
      tipoDoc: f.get("tipoDoc"),
      nroDoc: f.get("nroDoc"),
      nombre: f.get("nombre"),
      domicilio: f.get("domicilio"),
      telefono: f.get("telefono"),
      email: f.get("email"),
      cuentaCorriente: f.get("cuentaCorriente") === "on",
      limiteCredito: limite ? Math.round(Number(limite) * 100) : null,
    };
    const validacion = clienteSchema.safeParse(datos);
    if (!validacion.success) {
      mostrarErrores(e.currentTarget, validacion.error.issues, {
        limiteCredito: "limite",
      });
      setError(validacion.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      const resultado = await crearClienteAction(validacion.data);
      if (!resultado.ok) {
        mostrarErrorApi(formulario, resultado.error, {
          limiteCredito: "limite",
        });
        throw new Error(
          resultado.error.message || "No se pudo crear el cliente",
        );
      }
      formulario.reset();
      setAbierto(false);
      setAviso("Cliente creado correctamente.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            CUENTAS CORRIENTES
          </p>
          <h1 className="text-3xl font-semibold mt-2">Clientes</h1>
          <p className="muted mt-2">
            Consultá sus datos, movimientos y saldos.
          </p>
        </div>
        <Button
          variant="plain"
          size="plain"
          className="button"
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? "Cerrar formulario" : "+ Nuevo cliente"}
        </Button>
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
          <h2 className="font-semibold text-lg mb-4">Nuevo cliente</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-semibold">
              Tipo de documento
              <NativeSelect name="tipoDoc" className="mt-2">
                <option>DNI</option>
                <option>CUIT</option>
              </NativeSelect>
            </label>
            {[
              ["nroDoc", "Documento", true],
              ["nombre", "Nombre o razón social", true],
              ["domicilio", "Domicilio", false],
              ["telefono", "Teléfono", false],
              ["email", "Correo electrónico", false],
              ["limite", "Límite de crédito en pesos (opcional)", false],
            ].map(([name, label, obligatorio]) => (
              <label key={String(name)} className="text-sm font-semibold">
                {label}
                <Input
                  className="mt-2"
                  name={String(name)}
                  type={name === "email" ? "email" : "text"}
                  required={Boolean(obligatorio)}
                />
              </label>
            ))}
          </div>
          <label className="flex gap-2 items-center mt-5 text-sm">
            <Input name="cuentaCorriente" type="checkbox" className="!w-auto" />{" "}
            Habilitar cuenta corriente
          </label>
          <Button
            variant="plain"
            size="plain"
            className="button mt-5"
            disabled={guardando}
          >
            {guardando ? "Guardando…" : "Guardar cliente"}
          </Button>
        </form>
      )}
      <div className="panel mt-7 overflow-hidden">
        <div className="p-4 border-b border-[#edf1ee] flex flex-wrap items-center gap-4">
          <label className="sr-only" htmlFor="buscar-cliente">
            Buscar cliente
          </label>
          <Input
            id="buscar-cliente"
            className="!w-full sm:!w-72"
            type="search"
            placeholder="Buscar nombre o documento"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <Input
              type="checkbox"
              className="!w-auto"
              checked={soloDeuda}
              onChange={(event) =>
                actualizarFiltro(
                  "conDeuda",
                  event.target.checked ? "true" : "",
                )
              }
            />{" "}
            Solo con deuda
          </label>
          {soloDeuda && lista && (
            <span className="text-sm ml-auto">
              Total adeudado:{" "}
              <strong>{moneda(lista.totalAdeudado || 0)}</strong>
            </span>
          )}
        </div>
        {!lista && !error ? (
          <p role="status" className="p-8 muted">
            Cargando clientes…
          </p>
        ) : lista?.data.length === 0 ? (
          <p className="p-8 muted">No hay clientes para mostrar.</p>
        ) : (
          lista && (
            <>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>Cuenta corriente</th>
                      <th>Saldo</th>
                      <th>
                        <span className="sr-only">Detalle</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.data.map((c) => (
                      <tr key={c.id}>
                        <td className="font-semibold">{c.nombre}</td>
                        <td>
                          {c.tipoDoc} {c.nroDoc}
                        </td>
                        <td>
                          {c.cuentaCorriente ? "Habilitada" : "No habilitada"}
                        </td>
                        <td>{moneda(c.saldo)}</td>
                        <td>
                          <Link
                            className="text-emerald-800 font-semibold"
                            href={`/clientes/${c.id}`}
                          >
                            Ver ficha →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 flex justify-between items-center text-sm">
                <span className="muted">
                  {lista.total} clientes · Página {lista.page}
                </span>
                <div className="flex gap-4">
                  <Button
                    variant="plain"
                    size="plain"
                    disabled={pagina <= 1}
                    onClick={() => cambiarPagina(pagina - 1)}
                    className="disabled:opacity-40"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="plain"
                    size="plain"
                    disabled={pagina * lista.pageSize >= lista.total}
                    onClick={() => cambiarPagina(pagina + 1)}
                    className="disabled:opacity-40"
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
