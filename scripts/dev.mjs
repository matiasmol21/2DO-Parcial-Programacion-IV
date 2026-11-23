import { spawn } from "node:child_process";

// Mantiene el servidor de desarrollo separado de las carpetas de build y pruebas.
const servidor = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev"],
  {
    env: {
      ...process.env,
      NEXT_BUILD_DIR: ".next-dev",
    },
    stdio: "inherit",
  },
);

servidor.on("error", (error) => {
  console.error("No se pudo iniciar Next.js:", error.message);
  process.exitCode = 1;
});

servidor.on("exit", (codigo, senal) => {
  if (senal) {
    console.error(`El servidor se cerró por la señal ${senal}.`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = codigo ?? 1;
});
