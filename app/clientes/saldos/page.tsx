import Link from "next/link";
import { ArrowUpRight, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";
import Shell from "@/components/shell";
import { moneda } from "@/lib/formato";
import { usuarioActual } from "@/lib/session";
import { listarClientes } from "@/lib/services/clientes";

// RF-C6: muestra las cuentas con deuda ordenadas por saldo descendente.
export default async function PaginaSaldos({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  const parametros = await searchParams;
  const pagina = Math.max(1, Number.parseInt(parametros.page || "1", 10) || 1);
  const resultado = await listarClientes(
    usuario,
    new URLSearchParams({
      conDeuda: "true",
      orden: "saldo",
      page: String(pagina),
      pageSize: "20",
    }),
  );

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            CUENTAS CORRIENTES
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Saldos pendientes</h1>
          <p className="muted mt-2">
            Clientes con deuda, ordenados desde el mayor saldo.
          </p>
        </div>
        <Link
          href="/clientes"
          className="text-sm font-semibold text-emerald-800"
        >
          Ver todos los clientes
        </Link>
      </div>

      <section
        aria-label="Resumen de deuda"
        className="mt-7 grid gap-4 sm:grid-cols-2"
      >
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(31,67,56,0.05)]">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff2c8] text-[#7c5a12]">
              <WalletCards aria-hidden="true" className="h-4 w-4" />
            </span>{" "}
            Total adeudado
          </div>
          <p className="mt-4 text-2xl font-semibold text-[#173b34]">
            {moneda(resultado.totalAdeudado ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(31,67,56,0.05)]">
          <p className="text-sm text-slate-500">Clientes con deuda</p>
          <p className="mt-5 text-2xl font-semibold text-[#173b34]">
            {resultado.total}
          </p>
        </div>
      </section>

      <section
        className="panel mt-5 overflow-hidden"
        aria-labelledby="clientes-deudores"
      >
        <div className="border-b border-[#edf1ee] p-5">
          <h2 id="clientes-deudores" className="font-semibold">
            Detalle de saldos
          </h2>
        </div>
        {resultado.data.length === 0 ? (
          <p className="p-8 text-sm text-slate-500">
            No hay clientes con deuda pendiente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Saldo adeudado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultado.data.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="font-semibold">{cliente.nombre}</td>
                    <td>
                      {cliente.tipoDoc} {cliente.nroDoc}
                    </td>
                    <td className="font-semibold">{moneda(cliente.saldo)}</td>
                    <td>
                      <Link
                        className="inline-flex items-center gap-1 font-semibold text-emerald-800"
                        href={`/clientes/${cliente.id}`}
                      >
                        Ver cuenta{" "}
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {resultado.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1ee] p-4 text-sm">
            <span className="text-slate-500">
              {resultado.total} clientes con deuda · Página {resultado.page}
            </span>
            <div className="flex gap-3">
              <Link
                href={
                  pagina > 2
                    ? `/clientes/saldos?page=${pagina - 1}`
                    : "/clientes/saldos"
                }
                aria-disabled={pagina <= 1}
                tabIndex={pagina <= 1 ? -1 : undefined}
                className={`inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold ${pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
              >
                Anterior
              </Link>
              <Link
                href={`/clientes/saldos?page=${pagina + 1}`}
                aria-disabled={pagina * resultado.pageSize >= resultado.total}
                tabIndex={
                  pagina * resultado.pageSize >= resultado.total
                    ? -1
                    : undefined
                }
                className={`inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold ${pagina * resultado.pageSize >= resultado.total ? "pointer-events-none opacity-40" : "hover:bg-slate-100"}`}
              >
                Siguiente
              </Link>
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
