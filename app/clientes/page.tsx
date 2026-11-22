import Shell from "@/components/shell";
import ListaClientes from "@/components/lista-clientes";
import { exigirUsuario } from "@/lib/session";
import { listarClientes } from "@/lib/services/clientes";

type PropiedadesPagina = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaginaClientes({
  searchParams,
}: PropiedadesPagina) {
  const usuario = await exigirUsuario();
  const parametrosPagina = await searchParams;
  const parametrosConsulta = new URLSearchParams();

  for (const [nombre, valor] of Object.entries(parametrosPagina)) {
    if (typeof valor === "string") {
      parametrosConsulta.set(nombre, valor);
    }
  }

  const lista = await listarClientes(usuario, parametrosConsulta);

  return (
    <Shell>
      <ListaClientes
        lista={lista}
        filtros={Object.fromEntries(parametrosConsulta)}
      />
    </Shell>
  );
}
