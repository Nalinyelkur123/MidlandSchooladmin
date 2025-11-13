import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
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
import Timetable from './pages/Timetable';
import Subjects from './pages/Subjects';
import DashboardLayout from './layouts/DashboardLayout';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
    <AuthProvider>
      <Router>
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
                    <Route path="/timetable" element={<Timetable />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

