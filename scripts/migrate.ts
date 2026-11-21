import { migrate } from "drizzle-orm/libsql/migrator";
import { db, client } from "../db";
async function main() { await migrate(db,{migrationsFolder:"./drizzle"}); client.close(); console.log("Migraciones aplicadas."); }
main().catch(error=>{ console.error(error); process.exitCode=1; });
