import { cookies } from "next/headers";
import { conUsuario } from "@/lib/api";
export async function POST() {
  return conUsuario(async () => {
    (await cookies()).delete("sesion");
    return new Response(null, { status: 204 });
  });
}
