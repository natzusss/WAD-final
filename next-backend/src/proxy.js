import { NextResponse } from "next/server";
import { verifyJWT } from "./lib/auth";
import corsHeaders from "./lib/cors";
import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./lib/constant";

export function proxy(request) {
  // Browsers send OPTIONS before some API requests.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Login must be accessible without an existing session.
  if (request.nextUrl.pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  const user = verifyJWT(request);

  if (!user) {
    return NextResponse.json(
      { message: "Please log in" },
      { status: 401, headers: corsHeaders },
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(X_HEADER_USER_ID, user.id);
  requestHeaders.set(X_HEADER_USER_EMAIL, user.email);
  requestHeaders.set(X_HEADER_USER_NAME, user.username);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: "/api/:path*",
};