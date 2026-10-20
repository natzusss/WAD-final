//src/app/api/course/[course_id]/route.js

import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../../../lib/currentUser";
import { getClientPromise } from "../../../../lib/mongodb";
import {
  errorResponse,
  successResponse,
} from "../../../../lib/utils";

async function getContext(request, context) {
  const user = await getCurrentUser(request);

  if (!user) {
    return { error: errorResponse("Please log in", 401) };
  }

  const { course_id } = await context.params;

  if (!ObjectId.isValid(course_id)) {
    return { error: errorResponse("Invalid course ID", 400) };
  }

  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB);
  const courses = db.collection("courses");
  const course = await courses.findOne({
    _id: new ObjectId(course_id),
  });

  if (!course) {
    return { error: errorResponse("Course not found", 404) };
  }

  return { user, db, courses, course };
}

export async function GET(request, context) {
  try {
    const data = await getContext(request, context);
    if (data.error) return data.error;

    const { user, db, course } = data;

    if (user.role === "Teacher") {
      if (course.teacherId !== user._id.toString()) {
        return errorResponse("This is not your course", 403);
      }

      const students = await db.collection("users").find(
        {
          _id: {
            $in: course.studentIds.map((id) => new ObjectId(id)),
          },
        },
        { projection: { username: 1, email: 1 } },
      ).toArray();

      return successResponse({ course, students }, 200);
    }

    if (user.role !== "Student") {
      return errorResponse("Access denied", 403);
    }

    if (course.status === "Cancel") {
      return errorResponse("Course not found", 404);
    }

    return successResponse(
      {
        course: {
          ...course,
          studentIds: undefined,
          enrolledCount: course.studentIds.length,
          isEnrolled: course.studentIds.includes(user._id.toString()),
        },
      },
      200,
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Unable to load course", 500);
  }
}

export async function PUT(request, context) {
  try {
    const data = await getContext(request, context);
    if (data.error) return data.error;

    const { user, courses, course } = data;

    if (
      user.role !== "Teacher" ||
      course.teacherId !== user._id.toString()
    ) {
      return errorResponse("Only the course owner can update it", 403);
    }

    const { name, duration, topics, price, maxStudent, status } =
      await request.json();

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      !Array.isArray(topics) ||
      topics.length === 0 ||
      !topics.every((topic) =>
        typeof topic === "string" && topic.trim().length > 0
      ) ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(maxStudent) ||
      maxStudent <= 0 ||
      !["Open", "Close", "Cancel"].includes(status)
    ) {
      return errorResponse("Please provide valid course fields", 400);
    }

    const result = await courses.updateOne(
      {
        _id: course._id,
        teacherId: user._id.toString(),
        $expr: {
          $lte: [{ $size: "$studentIds" }, maxStudent],
        },
      },
      {
        $set: {
          name: name.trim(),
          duration,
          topics: topics.map((topic) => topic.trim()),
          price,
          maxStudent,
          status,
        },
      },
    );

    if (!result.matchedCount) {
      return errorResponse(
        "Max Student cannot be below the enrolled student count",
        409,
      );
    }

    return successResponse({ message: "Course updated" }, 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Unable to update course", 500);
  }
}

export async function DELETE(request, context) {
  try {
    const data = await getContext(request, context);
    if (data.error) return data.error;

    const { user, courses, course } = data;

    if (
      user.role !== "Teacher" ||
      course.teacherId !== user._id.toString()
    ) {
      return errorResponse("Only the course owner can delete it", 403);
    }

    const result = await courses.deleteOne({
      _id: course._id,
      teacherId: user._id.toString(),
      studentIds: { $size: 0 },
    });

    if (!result.deletedCount) {
      return errorResponse(
        "Cannot delete a course with enrolled Students",
        409,
      );
    }

    return successResponse({ message: "Course deleted" }, 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Unable to delete course", 500);
  }
}