import Shell from "@/components/shell";
import FichaCliente from "@/components/ficha-cliente";
export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell>
      <FichaCliente id={id} />
    </Shell>
  );
}
