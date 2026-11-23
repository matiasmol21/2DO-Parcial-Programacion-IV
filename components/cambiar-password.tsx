"use client";
import { cambiarPasswordAction } from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { Button } from "@/components/ui/button";
export default function CambiarPassword() {
  const [error, setError] = useState(""),
    [aviso, setAviso] = useState("");
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAviso("");
    const form = e.currentTarget,
      f = new FormData(form);
    try {
      const resultado = await cambiarPasswordAction({
        actual: f.get("actual"),
        nueva: f.get("nueva"),
      });
      if (!resultado.ok) {
        throw new Error(resultado.error.message);
      }
      form.reset();
      setAviso("Contraseña actualizada.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar la contraseña",
      );
    }
  }
  return (
    <>
      <h1 className="text-3xl font-semibold">Mi perfil</h1>
      <form onSubmit={enviar} className="panel p-6 mt-6 max-w-lg space-y-4">
        <h2 className="font-semibold">Cambiar contraseña</h2>
        <label className="block text-sm font-semibold">
          Contraseña actual
          <Input
            name="actual"
            type="password"
            autoComplete="current-password"
            className="mt-2"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Nueva contraseña
          <Input
            name="nueva"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="mt-2"
            required
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {aviso && (
          <p role="status" className="text-emerald-800">
            {aviso}
          </p>
        )}
        <Button>Guardar contraseña</Button>
      </form>
    </>
  );
}
