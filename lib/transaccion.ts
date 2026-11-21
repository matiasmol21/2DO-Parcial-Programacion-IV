import { ApiError } from "@/lib/errors";

// Una cola por proceso evita abrir transacciones simultáneas sobre la misma
// conexión local. SQLite sigue protegiendo los datos entre procesos distintos.
let turno:Promise<void>=Promise.resolve();
// SQLite puede rechazar un intento concurrente por bloqueo. Se reintenta la
// transacción completa para volver a leer stock y saldos antes de decidir.
export async function conReintento<T>(operacion:()=>Promise<T>):Promise<T>{
  const anterior=turno;let liberar!:()=>void;turno=new Promise(resolve=>{liberar=resolve;});await anterior;
  try{
    for(let intento=0;;intento++){
      try{return await operacion();}catch(error){
        let actual:unknown=error;let ocupado=false;
        for(let i=0;i<6&&actual;i++){if(typeof actual==="object"&&"code" in actual&&["SQLITE_BUSY","SQLITE_LOCKED"].includes(String((actual as {code:unknown}).code))){ocupado=true;break;}actual=typeof actual==="object"&&"cause" in actual?(actual as {cause:unknown}).cause:null;}
        if(!ocupado)throw error;
        if(intento>=6)throw new ApiError(503,"BASE_OCUPADA","La base está ocupada. Reintentá la operación.");
        await new Promise(resolve=>setTimeout(resolve,30*2**intento));
      }
    }
  }finally{liberar();}
}
