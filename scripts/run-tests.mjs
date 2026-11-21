import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
const carpeta=mkdtempSync(join(tmpdir(),"parcial-test-"));
try {
  const resultado=spawnSync(process.execPath,["--import","tsx","scripts/test-flujo.ts"],{stdio:"inherit",env:{...process.env,TEST_DATABASE_URL:pathToFileURL(join(carpeta,"prueba.db")).href}});
  process.exitCode=resultado.status??1;
} finally { rmSync(carpeta,{recursive:true,force:true,maxRetries:3,retryDelay:200}); }
