# Online Course Service

Student: Khun Ye Htet
Student ID: 6726046

## Projects

- next-backend: Next.js backend API
- react-frontend: React frontend using Vite
- Database: MongoDB

## Test Accounts

All accounts use password: `Exam2026!`

| Username | Role |
|----------|------|
| teacher1 | Teacher |
| teacher2 | Teacher |
| teacher3 | Teacher |
| student1 | Student |
| student2 | Student |
| student3 | Student |

## Local Setup

### Backend

Create `next-backend/.env.local`:

    MONGODB_URI=your_mongodb_connection_string
    MONGODB_DB=online_course_exam
    JWT_SECRET=your_random_secret
    FRONTEND_URL=http://localhost:5173

Run:

    cd next-backend
    npm install
    node --env-file=.env.local seed.cjs
    npm run dev

Backend: http://localhost:3000

The seed script creates missing test accounts without overwriting existing accounts.

### Frontend

Create `react-frontend/.env.local`:

    VITE_API_URL=http://localhost:3000/api

In a separate terminal, run:

    cd react-frontend
    npm install
    npm run dev

Frontend: http://localhost:5173

## How to Test

1. Log in as teacher1.
2. Create a course with multiple comma-separated topics.
3. View its details and enrolled Students.
4. Edit the course and save changes.
5. Log in as teacher2; teacher1's courses must not appear.
6. Log in as student1.
7. Search using part of a course name or Teacher username.
8. Enroll in an Open course with available seats.
9. Select My Enrolled Courses to view the enrollment.
10. Verify that duplicate enrollment is blocked.
11. Fill a course to its maximum capacity; further enrollment must be blocked.
12. Change a course to Close: Students can see it but cannot enroll.
13. Change a course to Cancel: it disappears from Student course lists.
14. Try deleting a course with enrolled Students: deletion must be blocked.
15. Delete a course with no enrolled Students: deletion should succeed.
16. Refresh the browser to check that login is maintained.
17. Log out to end the session.

## Backend Rules

- Protected API operations require a valid login token.
- Course operations check the current user's database role.
- Teachers can manage only their own courses.
- Only Students can enroll.
- Enrollment checks status, capacity, and duplicate enrollment atomically.
- A course with enrolled Students cannot be deleted.
- Maximum capacity cannot be reduced below the enrolled count.
- Passwords are hashed with bcrypt.
- Login tokens are stored in HTTP-only cookies.

## Production Builds

Backend:

    cd next-backend
    npm run build

Frontend:

    cd react-frontend
    npm run build

## Deployment Configuration

Backend environment variables:

- MONGODB_URI
- MONGODB_DB
- JWT_SECRET
- FRONTEND_URL: deployed frontend origin without a trailing slash

Frontend environment variable:

- VITE_API_URL: deployed backend URL followed by /api

Deploy next-backend and react-frontend as separate projects.
Configure MongoDB Atlas network access to permit backend connections.
Redeploy after changing environment variables.

## Submission Links

- Backend source: https://github.com/natzusss/WAD-final/tree/main/next-backend
- Frontend source: https://github.com/natzusss/WAD-final/tree/main/react-frontend
- Backend deployment: https://wad-final-backend-six.vercel.app
- Frontend deployment: https://wad-final-frontend-two.vercel.app
- Screen recording: TO BE ADDED