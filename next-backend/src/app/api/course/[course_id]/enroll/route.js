import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../../../../lib/currentUser";
import { getClientPromise } from "../../../../../lib/mongodb";
import {
  errorResponse,
  successResponse,
} from "../../../../../lib/utils";

export async function POST(request, context) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return errorResponse("Please log in", 401);
    }

    if (user.role !== "Student") {
      return errorResponse("Only Students can enroll", 403);
    }

    const { course_id } = await context.params;

    if (!ObjectId.isValid(course_id)) {
      return errorResponse("Invalid course ID", 400);
    }

    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB);
    const courses = db.collection("courses");
    const studentId = user._id.toString();
    const courseId = new ObjectId(course_id);

    // Check all enrollment rules and add the student atomically.
    const result = await courses.updateOne(
      {
        _id: courseId,
        status: "Open",
        studentIds: { $ne: studentId },
        $expr: {
          $lt: [{ $size: "$studentIds" }, "$maxStudent"],
        },
      },
      {
        $addToSet: { studentIds: studentId },
      },
    );

    if (result.modifiedCount === 1) {
      return successResponse({ message: "Enrolled successfully" }, 200);
    }

    const course = await courses.findOne({ _id: courseId });

    if (!course || course.status === "Cancel") {
      return errorResponse("Course not found", 404);
    }

    if (course.studentIds.includes(studentId)) {
      return errorResponse("You are already enrolled", 409);
    }

    if (course.status !== "Open") {
      return errorResponse("This course is closed", 409);
    }

    return errorResponse("This course is full", 409);
  } catch (error) {
    console.error(error);
    return errorResponse("Unable to enroll", 500);
  }
}