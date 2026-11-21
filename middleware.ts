import { jwtVerify } from "jose/jwt/verify";
import { NextResponse, type NextRequest } from "next/server";

// Primera barrera de acceso: los servicios vuelven a resolver el usuario en la base.
export async function middleware(request:NextRequest){if(request.nextUrl.pathname==="/login")return NextResponse.next();const token=request.cookies.get("sesion")?.value,secret=process.env.SESSION_SECRET;try{if(!token||!secret||secret.length<32)throw new Error("Sesión ausente");await jwtVerify(token,new TextEncoder().encode(secret),{algorithms:["HS256"]});return NextResponse.next();}catch{return NextResponse.redirect(new URL("/login",request.url));}}
export const config={matcher:["/((?!api|_next/static|_next/image|favicon.ico).*)"]};
