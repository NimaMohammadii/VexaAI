import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_NAME = "vexa_session";

const verifySession = async (token: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload;
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const payload = await verifySession(token);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
