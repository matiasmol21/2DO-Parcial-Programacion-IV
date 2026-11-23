import { redirect } from "next/navigation";
import Shell from "@/components/shell";
import GestionUsuarios from "@/components/gestion-usuarios";
import { usuarioActual } from "@/lib/session";
import { listarUsuarios } from "@/lib/services/usuarios";

type PropiedadesPagina = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Pagina({ searchParams }: PropiedadesPagina) {
  const usuario = await usuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "admin") {
    redirect("/");
  }

  const parametrosPagina = await searchParams;
  const parametrosConsulta = new URLSearchParams();

  for (const [nombre, valor] of Object.entries(parametrosPagina)) {
    if (typeof valor === "string") {
      parametrosConsulta.set(nombre, valor);
    }
  }

  const lista = await listarUsuarios(usuario, parametrosConsulta);

  return (
    <Shell>
      <GestionUsuarios
        lista={lista}
        filtros={Object.fromEntries(parametrosConsulta)}
      />
    </Shell>
  );
}
