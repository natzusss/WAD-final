//src/app/api/auth/login/route.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getClientPromise } from "../../../../lib/mongodb";
import {
  errorResponse,
  successResponse,
} from "../../../../lib/utils";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (typeof username !== "string" || typeof password !== "string") {
      return errorResponse("Username and password are required", 400);
    }

    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB);
    const user = await db.collection("users").findOne({
      username: username.trim(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return errorResponse("Invalid username or password", 401);
    }

    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    const response = successResponse({ user: userData }, 200);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 3,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return errorResponse("Unable to log in", 500);
  }
}