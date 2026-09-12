import { NextResponse } from "next/server";

const allowedOrigins = new Set([
  "https://noadua.com",
  "https://www.noadua.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export function middleware(req) {
  const origin = req.headers.get("origin");
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (!isApi) return NextResponse.next();

  if (req.method === "OPTIONS") {
    if (!origin || !allowedOrigins.has(origin)) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }

  const response = NextResponse.next();

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
