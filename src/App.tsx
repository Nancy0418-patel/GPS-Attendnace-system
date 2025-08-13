import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GeolocationProvider } from './contexts/GeolocationContext';
import Login from './components/Login';
import HostDashboard from './components/HostDashboard';
import StudentInterface from './components/StudentInterface';
import StudentProfile from './components/StudentProfile';
import HostProfile from './components/HostProfile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <GeolocationProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/host" element={
                <ProtectedRoute requiredRole="host">
                  <HostDashboard />
                </ProtectedRoute>
              } />
              <Route path="/host/profile" element={
                <ProtectedRoute requiredRole="host">
                  <HostProfile />
                </ProtectedRoute>
              } />
              <Route path="/student" element={
                <ProtectedRoute requiredRole="student">
                  <StudentInterface />
                </ProtectedRoute>
              } />
              <Route path="/student/profile" element={
                <ProtectedRoute requiredRole="student">
                  <StudentProfile />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </GeolocationProvider>
    </AuthProvider>
  );
}

export default App;