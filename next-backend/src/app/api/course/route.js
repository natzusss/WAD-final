//src/app/api/course/route.js

import { getCurrentUser } from "../../../lib/currentUser";
import { getClientPromise } from "../../../lib/mongodb";
import {
  errorResponse,
  successResponse,
} from "../../../lib/utils";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return errorResponse("Please log in", 401);

    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB);
    const userId = user._id.toString();

    let filter;

    if (user.role === "Teacher") {
      filter = { teacherId: userId };
    } else if (user.role === "Student") {
      filter = { status: { $ne: "Cancel" } };

      if (request.nextUrl.searchParams.get("enrolled") === "true") {
        filter.studentIds = userId;
      }
    } else {
      return errorResponse("Invalid role", 403);
    }

    let courses = await db.collection("courses")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const search = (
      request.nextUrl.searchParams.get("search") || ""
    ).trim().toLowerCase();

    if (search) {
      courses = courses.filter(
        (course) =>
          course.name.toLowerCase().includes(search) ||
          course.teacherName.toLowerCase().includes(search),
      );
    }

    return successResponse({ courses }, 200);
  } catch (error) {
    console.error(error);
    return errorResponse("Unable to load courses", 500);
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return errorResponse("Please log in", 401);

    if (user.role !== "Teacher") {
      return errorResponse("Only Teachers can create courses", 403);
    }

    const body = await request.json();
    const { name, duration, topics, price, maxStudent } = body;
    const status = body.status ?? "Open";

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

    const client = await getClientPromise();
    const db = client.db(process.env.MONGODB_DB);

    const course = {
      name: name.trim(),
      duration,
      topics: topics.map((topic) => topic.trim()),
      price,
      maxStudent,
      status,
      teacherId: user._id.toString(),
      teacherName: user.username,
      studentIds: [],
      createdAt: new Date(),
    };

    const result = await db.collection("courses").insertOne(course);

    return successResponse(
      { course: { ...course, _id: result.insertedId } },
      201,
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Unable to create course", 500);
  }
}