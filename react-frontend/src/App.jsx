import CourseForm from "./CourseForm";
import CourseList from "./CourseList";
import { useContext, useState } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { UserContext } from "./context/UserContext";
import "./App.css";

function Login() {
  const { user, login } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await login(username, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Online Course Service</h1>
      <h2>Log in</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p role="alert">{error}</p>}

        <button disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}

function Dashboard() {
  const { user, logout } = useContext(UserContext);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <main>
      <h1>Online Course Service</h1>
      <p>
        Welcome, {user.username} — {user.role}
      </p>
      <button onClick={handleLogout}>Log out</button>
      {error && <p role="alert">{error}</p>}
      <h2>{user.role === "Teacher" ? "My Courses" : "Available Courses"}</h2>
      {user.role === "Teacher" && (
  <CourseForm onSaved={() => setRefreshKey((value) => value + 1)} />
)}
<CourseList key={refreshKey} />
    </main>
  );
}

function Protected({ children }) {
  const { user } = useContext(UserContext);
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useContext(UserContext);

  if (loading) return <p>Loading...</p>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}