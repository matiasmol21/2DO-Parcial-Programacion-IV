import Shell from "@/components/shell";
import Catalogo from "@/components/catalogo";
import { exigirUsuario } from "@/lib/session";
import { listarCategorias, listarProductos } from "@/lib/services/productos";

type PropiedadesPagina = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Productos({ searchParams }: PropiedadesPagina) {
  const usuario = await exigirUsuario();
  const parametrosPagina = await searchParams;
  const parametrosConsulta = new URLSearchParams();

  for (const [nombre, valor] of Object.entries(parametrosPagina)) {
    if (typeof valor === "string") {
      parametrosConsulta.set(nombre, valor);
    }
  }

  const [lista, categorias] = await Promise.all([
    listarProductos(usuario, parametrosConsulta),
    listarCategorias(usuario),
  ]);

  return (
    <Shell>
      <Catalogo
        admin={usuario.rol === "admin"}
        lista={lista}
        categorias={categorias}
        filtros={Object.fromEntries(parametrosConsulta)}
      />
    </Shell>
  );
}
