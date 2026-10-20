//src/app/api/user/[user_id]/route.js

import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../../../lib/currentUser";
import {
  errorResponse,
  successResponse,
} from "../../../../lib/utils";

export async function GET(request, context) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return errorResponse("Please log in", 401);
    }

    const { user_id } = await context.params;

    if (!ObjectId.isValid(user_id)) {
      return errorResponse("Invalid user ID", 400);
    }

    if (user._id.toString() !== user_id) {
      return errorResponse("You can only view your own profile", 403);
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
    console.error(error);
    return errorResponse("Unable to load profile", 500);
  }
}
