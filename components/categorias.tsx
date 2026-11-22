"use client";
import {
  crearCategoriaAction,
  editarCategoriaAction,
} from "@/app/actions/categorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
type Categoria = { id: number; nombre: string };
export default function Categorias({
  admin,
  lista,
}: {
  admin: boolean;
  lista: Categoria[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    setError("");
    try {
      const resultado = await crearCategoriaAction({ nombre: f.get("nombre") });
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }

      form.reset();
      setAviso("Categoría creada.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    }
  }
  async function editar(id: number, datos: object) {
    setError("");
    try {
      const resultado = await editarCategoriaAction(id, datos);
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }

      setAviso("Categoría actualizada.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }
  return (
    <>
      <Link
        className="text-sm text-emerald-800 font-semibold"
        href="/productos"
      >
        ← Volver a productos
      </Link>
      <h1 className="text-3xl font-semibold mt-6">Categorías</h1>
      <p className="muted mt-2">Organizá los productos del catálogo.</p>
      {error && (
        <p role="alert" className="text-red-700 mt-4">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="text-emerald-800 mt-4">
          {aviso}
        </p>
      )}
      {admin && (
        <form
          onSubmit={crear}
          className="panel p-5 mt-6 flex flex-wrap gap-3 items-end"
        >
          <label className="text-sm font-semibold flex-1">
            Nombre de categoría
            <Input name="nombre" className="mt-2" required />
          </label>
          <Button variant="plain" size="plain" className="button">
            Agregar
          </Button>
        </form>
      )}
      <div className="panel mt-5 overflow-x-auto">
        {!lista ? (
          <p className="p-5 muted">Cargando…</p>
        ) : lista.length === 0 ? (
          <p className="p-5 muted">No hay categorías.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>
                    <div className="flex gap-4">
                      {admin && (
                        <>
                          <Button
                            variant="plain"
                            size="plain"
                            className="text-emerald-800"
                            onClick={() => {
                              const nombre = prompt(
                                "Nombre de la categoría",
                                c.nombre,
                              );
                              if (nombre?.trim()) void editar(c.id, { nombre });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="plain"
                            size="plain"
                            className="text-red-700"
                            onClick={() => {
                              if (confirm("¿Dar de baja esta categoría?"))
                                void editar(c.id, { activa: false });
                            }}
                          >
                            Dar de baja
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
