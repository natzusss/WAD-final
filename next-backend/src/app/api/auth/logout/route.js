//src/app/api/auth/logout/route.js

import { successResponse } from "../../../../lib/utils";

export async function POST() {
  const response = successResponse({ message: "Logged out" }, 200);

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}