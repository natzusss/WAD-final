import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function CourseForm({ course = null, onSaved, onCancel }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isEditing = Boolean(course);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    const body = {
      name: values.get("name").trim(),
      duration: Number(values.get("duration")),
      topics: values
        .get("topics")
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
      price: Number(values.get("price")),
      maxStudent: Number(values.get("maxStudent")),
      status: values.get("status"),
    };

    setError("");
    setBusy(true);

    try {
      const url = isEditing
        ? `${API_URL}/course/${course._id}`
        : `${API_URL}/course`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save course");
      }

      if (!isEditing) form.reset();
      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEditing ? "Edit Course" : "Create Course"}</h2>

      <label>
        Course name
        <input
          name="name"
          defaultValue={course?.name ?? ""}
          required
        />
      </label>

      <label>
        Duration (days)
        <input
          name="duration"
          type="number"
          min="1"
          step="1"
          defaultValue={course?.duration ?? ""}
          required
        />
      </label>

      <label>
        Topics (separate with commas)
        <input
          name="topics"
          placeholder="HTML, CSS, React"
          defaultValue={course?.topics.join(", ") ?? ""}
          required
        />
      </label>

      <label>
        Price (THB)
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={course?.price ?? ""}
          required
        />
      </label>

      <label>
        Max Student
        <input
          name="maxStudent"
          type="number"
          min="1"
          step="1"
          defaultValue={course?.maxStudent ?? ""}
          required
        />
      </label>

      <label>
        Status
        <select
          name="status"
          defaultValue={course?.status ?? "Open"}
        >
          <option value="Open">Open</option>
          <option value="Close">Close</option>
          <option value="Cancel">Cancel</option>
        </select>
      </label>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={busy}>
        {busy
          ? "Saving..."
          : isEditing
            ? "Save Changes"
            : "Create Course"}
      </button>

      {onCancel && (
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel Editing
        </button>
      )}
    </form>
  );
}