import Shell from "@/components/shell";
import ListaFacturas from "@/components/lista-facturas";
import { exigirUsuario } from "@/lib/session";
import { listarFacturas } from "@/lib/services/facturas";

type PropiedadesPagina = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Ventas({ searchParams }: PropiedadesPagina) {
  const usuario = await exigirUsuario();
  const parametros = await searchParams;
  const consulta = new URLSearchParams();

  for (const [nombre, valor] of Object.entries(parametros)) {
    if (typeof valor === "string") {
      consulta.set(nombre, valor);
    }
  }

  const lista = await listarFacturas(usuario, consulta);

  return (
    <Shell>
      <ListaFacturas lista={lista} filtros={Object.fromEntries(consulta)} />
    </Shell>
  );
}
