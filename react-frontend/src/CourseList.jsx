import { useContext, useEffect, useState } from "react";
import CourseDetails from "./CourseDetails";
import CourseForm from "./CourseForm";
import { UserContext } from "./context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function CourseList() {
  const { user } = useContext(UserContext);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [enrolledOnly, setEnrolledOnly] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (enrolledOnly && user.role === "Student") {
          params.set("enrolled", "true");
        }

        const response = await fetch(`${API_URL}/course?${params}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load courses");
        }

        if (active) setCourses(data.courses);
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [user.id, user.role, refreshKey, enrolledOnly]);

  async function deleteCourse(courseId) {
    if (!window.confirm("Delete this course?")) return;

    setBusyId(courseId);

    try {
      const response = await fetch(`${API_URL}/course/${courseId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete course");
      }

      setCourses((previous) =>
        previous.filter((course) => course._id !== courseId)
      );

      if (selectedId === courseId) setSelectedId(null);
      if (editingId === courseId) setEditingId(null);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusyId(null);
    }
  }

  async function enroll(courseId) {
    setBusyId(courseId);

    try {
      const response = await fetch(
        `${API_URL}/course/${courseId}/enroll`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to enroll");
      }

      window.alert(data.message);
      setSelectedId(null);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleSaved() {
    setEditingId(null);
    setSelectedId(null);
    setRefreshKey((value) => value + 1);
  }

  const query = search.trim().toLowerCase();

  const visibleCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(query) ||
      course.teacherName.toLowerCase().includes(query)
  );

  return (
    <section>
      {user.role === "Student" && (
        <>
          <button onClick={() => setEnrolledOnly(false)}>
            All Courses
          </button>
          <button onClick={() => setEnrolledOnly(true)}>
            My Enrolled Courses
          </button>
          <h3>
            {enrolledOnly ? "My Enrolled Courses" : "All Courses"}
          </h3>
        </>
      )}

      <label>
        Search by course or Teacher name
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type part of a name..."
        />
      </label>

      {loading && <p>Loading courses...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && visibleCourses.length === 0 && (
        <p>No courses found.</p>
      )}

      {!loading && !error && visibleCourses.map((course) => {
        const isEnrolled = course.studentIds.includes(user.id);
        const isFull = course.studentIds.length >= course.maxStudent;

        return (
          <article key={course._id}>
            <h3>{course.name}</h3>
            <p>Teacher: {course.teacherName}</p>
            <p>Duration: {course.duration} days</p>
            <p>Topics: {course.topics.join(", ")}</p>
            <p>Price: {course.price} THB</p>
            <p>
              Students: {course.studentIds.length} / {course.maxStudent}
            </p>
            <p>Status: {course.status}</p>

            <button
              onClick={() => {
                setSelectedId(course._id);
                setEditingId(null);
              }}
            >
              View Details
            </button>

            {user.role === "Student" && (
              <button
                onClick={() => enroll(course._id)}
                disabled={
                  busyId === course._id ||
                  isEnrolled ||
                  isFull ||
                  course.status !== "Open"
                }
              >
                {busyId === course._id
                  ? "Enrolling..."
                  : isEnrolled
                    ? "Already Enrolled"
                    : course.status !== "Open"
                      ? "Closed"
                      : isFull
                        ? "Full"
                        : "Enroll"}
              </button>
            )}

            {user.role === "Teacher" && (
              <>
                <button
                  onClick={() => {
                    setEditingId(course._id);
                    setSelectedId(null);
                  }}
                >
                  Edit Course
                </button>

                <button
                  onClick={() => deleteCourse(course._id)}
                  disabled={busyId === course._id}
                >
                  {busyId === course._id
                    ? "Deleting..."
                    : "Delete Course"}
                </button>
              </>
            )}

            {editingId === course._id && (
              <CourseForm
                key={course._id}
                course={course}
                onSaved={handleSaved}
                onCancel={() => setEditingId(null)}
              />
            )}

            {selectedId === course._id && (
              <CourseDetails
                key={selectedId}
                courseId={selectedId}
                onClose={() => setSelectedId(null)}
              />
            )}
          </article>
        );
      })}
    </section>
  );
}