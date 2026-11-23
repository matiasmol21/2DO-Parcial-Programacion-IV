"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

export default function Login() {
  const router = useRouter();
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function completarCredenciales(email: string, password: string) {
    if (emailInput.current) {
      emailInput.current.value = email;
    }

    if (passwordInput.current) {
      passwordInput.current.value = password;
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message || "No se pudo iniciar sesión");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#edf2ef] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(23,59,52,0.14)] lg:min-h-[calc(100vh-64px)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#173b34] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-36 right-[-80px] h-[420px] w-[420px] rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d8f26b] text-[#173b34] shadow-lg">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.22em]">
                  VERDE SUR
                </p>
                <p className="mt-0.5 text-xs text-emerald-100/70">
                  Almacén integral
                </p>
              </div>
            </div>
          </div>
          <div className="relative max-w-lg">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" /> Operación segura
            </span>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight">
              Tu comercio,
              <br />
              <span className="text-[#d8f26b]">bajo control.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-emerald-50/75">
              Administrá ventas, existencias y cuentas corrientes desde un único
              lugar.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <ShoppingBag className="h-5 w-5 text-[#d8f26b]" />
                <p className="mt-4 text-sm font-semibold">Ventas del día</p>
                <p className="mt-1 text-xs text-emerald-100/60">
                  Seguimiento en tiempo real
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <BarChart3 className="h-5 w-5 text-[#d8f26b]" />
                <p className="mt-4 text-sm font-semibold">Reportes claros</p>
                <p className="mt-1 text-xs text-emerald-100/60">
                  Decisiones más simples
                </p>
              </div>
            </div>
          </div>
          <p className="relative text-xs text-emerald-100/50">
            Sistema de gestión comercial · Práctica académica
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#173b34] text-[#d8f26b]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-[#173b34]">
                  VERDE SUR
                </p>
                <p className="text-xs text-slate-500">Almacén integral</p>
              </div>
            </div>
            <p className="text-sm font-bold text-[#24705d]">BIENVENIDO</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#173b34] sm:text-4xl">
              Iniciar sesión
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ingresá tus datos para acceder al panel de gestión.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#263934]"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    ref={emailInput}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 shadow-none focus:border-[#24705d] focus:bg-white"
                    placeholder="nombre@comercio.com"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[#263934]"
                  >
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    ref={passwordInput}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 shadow-none focus:border-[#24705d] focus:bg-white"
                    placeholder="Ingresá tu contraseña"
                  />
                </div>
              </div>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}
              <Button
                variant="plain"
                size="plain"
                className="h-12 w-full rounded-xl bg-[#173b34] text-base text-white shadow-[0_10px_24px_rgba(23,59,52,0.18)] hover:bg-[#205447] disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Ingresando…" : "Ingresar al sistema"}
              </Button>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-[#173b34]/20 text-[#173b34] hover:bg-[#edf2ef]"
                  onClick={() =>
                    completarCredenciales("admin@ejemplo.com", "Admin1234")
                  }
                  disabled={loading}
                >
                  Entrar como administrador
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-[#173b34]/20 text-[#173b34] hover:bg-[#edf2ef]"
                  onClick={() =>
                    completarCredenciales(
                      "vendedor@ejemplo.com",
                      "Vendedor1234",
                    )
                  }
                  disabled={loading}
                >
                  Entrar como vendedor
                </Button>
              </div>
            </form>
            <p className="mt-8 text-center text-xs text-slate-400">
              Acceso reservado al personal autorizado
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
