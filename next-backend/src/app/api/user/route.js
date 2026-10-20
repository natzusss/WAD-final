//src/app/api/user/route.js

import { ObjectId } from "mongodb";
import { verifyJWT } from "../../../lib/auth";
import { getClientPromise } from "../../../lib/mongodb";
import {
  errorResponse,
  successResponse,
} from "../../../lib/utils";

export async function GET(request) {
  const session = verifyJWT(request);

  if (!session || !ObjectId.isValid(session.id)) {
    return errorResponse("Please log in", 401);
  }

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB);

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.id) },
      { projection: { password: 0 } },
    );

    if (!user) {
      return errorResponse("User not found", 401);
    }

    return successResponse(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Session check failed:", error);
    return errorResponse("Unable to check session", 500);
  }
}