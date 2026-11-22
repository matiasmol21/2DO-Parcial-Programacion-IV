"use client";
import {
  crearUsuarioAction,
  editarUsuarioAction,
  restablecerPasswordAction,
} from "@/app/actions/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "vendedor";
  activo: boolean;
};
type Lista = {
  data: Usuario[];
  total: number;
  page: number;
  pageSize: number;
};

type Filtros = {
  q?: string;
  page?: string;
};

type Propiedades = {
  lista: Lista;
  filtros: Filtros;
};

export default function GestionUsuarios({ lista, filtros }: Propiedades) {
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

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAviso("");
    const f = new FormData(e.currentTarget);
    try {
      const resultado = await crearUsuarioAction(Object.fromEntries(f));
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }
      setAbierto(false);
      setAviso("Usuario creado.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el usuario",
      );
    }
  }
  async function modificar(id: number, datos: object) {
    setError("");
    try {
      const resultado = await editarUsuarioAction(id, datos);
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }
      setAviso("Usuario actualizado.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  }
  async function reset(id: number) {
    if (!window.confirm("¿Restablecer la contraseña de este usuario?")) return;
    try {
      const resultado = await restablecerPasswordAction(id);
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }
      setAviso(
        `Contraseña temporal: ${resultado.data.passwordTemporal}. Copiala ahora; no se vuelve a mostrar.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restablecer");
    }
  }
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            ADMINISTRACIÓN
          </p>
          <h1 className="text-3xl font-semibold mt-2">Usuarios</h1>
          <p className="muted mt-2">Administrá el acceso al sistema.</p>
        </div>
        <Button
          variant="plain"
          size="plain"
          className="button"
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? "Cerrar" : "+ Nuevo usuario"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-red-700 mt-5">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="text-emerald-800 mt-5 break-all">
          {aviso}
        </p>
      )}
      {abierto && (
        <form onSubmit={crear} className="panel p-6 mt-6">
          <h2 className="font-semibold mb-4">Nuevo usuario</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm font-semibold">
              Nombre
              <Input name="nombre" className="mt-2" required />
            </label>
            <label className="text-sm font-semibold">
              Email
              <Input name="email" type="email" className="mt-2" required />
            </label>
            <label className="text-sm font-semibold">
              Contraseña temporal
              <Input
                name="password"
                type="password"
                minLength={8}
                className="mt-2"
                required
              />
            </label>
            <label className="text-sm font-semibold">
              Rol
              <NativeSelect name="rol" className="mt-2">
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </NativeSelect>
            </label>
          </div>
          <Button variant="plain" size="plain" className="button mt-4">
            Crear usuario
          </Button>
        </form>
      )}
      <div className="panel mt-7 p-4">
        <label className="text-sm">
          Buscar usuario
          <Input
            type="search"
            className="mt-2"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>
      </div>
      <div className="panel mt-3 overflow-x-auto">
        {lista.data.length === 0 ? (
          <p className="p-6 muted">No hay usuarios.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.data.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <NativeSelect
                      aria-label={`Rol de ${u.nombre}`}
                      value={u.rol}
                      onChange={(e) => modificar(u.id, { rol: e.target.value })}
                    >
                      <option value="admin">Administrador</option>
                      <option value="vendedor">Vendedor</option>
                    </NativeSelect>
                  </td>
                  <td>{u.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <div className="flex gap-3 whitespace-nowrap">
                      <Button
                        variant="plain"
                        size="plain"
                        className="text-emerald-800"
                        onClick={() => {
                          const nombre = prompt("Nombre", u.nombre);
                          if (nombre === null) return;
                          const email = prompt("Email", u.email);
                          if (email === null) return;
                          if (nombre.trim() && email.trim())
                            void modificar(u.id, { nombre, email });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="plain"
                        size="plain"
                        className="text-emerald-800"
                        onClick={() => reset(u.id)}
                      >
                        Restablecer clave
                      </Button>
                      <Button
                        variant="plain"
                        size="plain"
                        className="text-red-700"
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿${u.activo ? "Desactivar" : "Activar"} a ${u.nombre}?`,
                            )
                          )
                            void modificar(u.id, { activo: !u.activo });
                        }}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex gap-4 mt-4 text-sm">
        <Button
          variant="plain"
          size="plain"
          disabled={pagina <= 1}
          onClick={() => cambiarPagina(pagina - 1)}
          className="disabled:opacity-40"
        >
          Anterior
        </Button>
        <span>
          Página {pagina} · {lista.total} usuarios
        </span>
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
    </>
  );
}
