import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SearchProvider } from './context/SearchContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardHome from './pages/DashboardHome';
import Students from './pages/students/Students';
import StudentCreate from './pages/students/StudentCreate';
import StudentEdit from './pages/students/StudentEdit';
import StudentProfile from './pages/students/StudentProfile';
import Teachers from './pages/teachers/Teachers';
import TeacherCreate from './pages/teachers/TeacherCreate';
import TeacherEdit from './pages/teachers/TeacherEdit';
import TeacherProfile from './pages/teachers/TeacherProfile';
import Admins from './pages/admin/Admins';
import AdminCreate from './pages/admin/AdminCreate';
import AdminEdit from './pages/admin/AdminEdit';
import AdminProfile from './pages/admin/AdminProfile';
import Schools from './pages/schools/Schools';
import SchoolCreate from './pages/schools/SchoolCreate';
import SchoolEdit from './pages/schools/SchoolEdit';
import SchoolProfile from './pages/schools/SchoolProfile';
import Timetable from './pages/timetable/Timetable';
import TimetableCreate from './pages/timetable/TimetableCreate';
import Subjects from './pages/subjects/Subjects';
import SubjectCreate from './pages/subjects/SubjectCreate';
import SubjectEdit from './pages/subjects/SubjectEdit';
import Attendance from './pages/attendance/Attendance';
import Events from './pages/Events';
import DashboardLayout from './layouts/DashboardLayout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
    <AuthProvider>
      <Router>
        <SearchProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/students/create" element={<StudentCreate />} />
                    <Route path="/students/:id" element={<StudentProfile />} />
                    <Route path="/students/:id/edit" element={<StudentEdit />} />
                    <Route path="/teachers" element={<Teachers />} />
                    <Route path="/teachers/create" element={<TeacherCreate />} />
                    <Route path="/teachers/:id" element={<TeacherProfile />} />
                    <Route path="/teachers/:id/edit" element={<TeacherEdit />} />
                    <Route path="/admin" element={<Admins />} />
                    <Route path="/admin/create" element={<AdminCreate />} />
                    <Route path="/admin/:id" element={<AdminProfile />} />
                    <Route path="/admin/:id/edit" element={<AdminEdit />} />
                    <Route path="/schools" element={<Schools />} />
                    <Route path="/schools/create" element={<SchoolCreate />} />
                    <Route path="/schools/:id" element={<SchoolProfile />} />
                    <Route path="/schools/:id/edit" element={<SchoolEdit />} />
                    <Route path="/timetable" element={<Timetable />} />
                    <Route path="/timetable/create" element={<TimetableCreate />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/subjects/create" element={<SubjectCreate />} />
                    <Route path="/subjects/:id/edit" element={<SubjectEdit />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </RequireAuth>
            }
          />
        </Routes>
        </SearchProvider>
      </Router>
    </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

