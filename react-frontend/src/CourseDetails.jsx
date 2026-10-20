import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function CourseDetails({ courseId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      try {
        const response = await fetch(`${API_URL}/course/${courseId}`, {
          credentials: "include",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load details");
        }

        if (active) setData(result);
      } catch (error) {
        if (active) setError(error.message);
      }
    }

    loadDetails();

    return () => {
      active = false;
    };
  }, [courseId]);

  return (
    <article>
      <button onClick={onClose}>Close Details</button>

      {error && <p role="alert">{error}</p>}
      {!data && !error && <p>Loading details...</p>}

      {data && (
        <>
          <h3>{data.course.name} — Details</h3>
          <p>Teacher: {data.course.teacherName}</p>
          <p>Duration: {data.course.duration} days</p>
          <p>Topics: {data.course.topics.join(", ")}</p>
          <p>Price: {data.course.price} THB</p>
          <p>Max Student: {data.course.maxStudent}</p>
          <p>Status: {data.course.status}</p>

          {data.students && (
            <>
              <h3>Enrolled Students</h3>
              {data.students.length === 0 && <p>No Students enrolled.</p>}
              {data.students.map((student) => (
                <p key={student._id}>
                  {student.username} — {student.email}
                </p>
              ))}
            </>
          )}
        </>
      )}
    </article>
  );
}