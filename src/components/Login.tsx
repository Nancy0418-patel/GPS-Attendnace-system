import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, GraduationCap, MapPin, QrCode, Shield } from 'lucide-react';

const Login: React.FC = () => {
  const { user, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'host' | 'student'>('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(formData.email, formData.password, role);
        if (!success) {
          setError('Invalid credentials or role mismatch');
        }
      } else {
        success = await register(formData.email, formData.password, formData.name, role);
        if (!success) {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-400 via-indigo-200 to-purple-200">
      <div className="max-w-md w-full relative">
        {/* Animated Gradient Border */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-400 to-indigo-400 blur opacity-60 animate-pulse z-0"></div>
        <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-full mb-4 shadow-lg">
              <QrCode size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">AttendanceGPS</h1>
            <p className="text-gray-600 text-base">Secure location-based attendance system</p>
          </div>

          {/* Features Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl shadow border border-blue-100 p-4 mb-6 flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <MapPin size={24} className="text-blue-600 mb-1" />
              <span className="text-xs text-gray-700 font-medium">GPS Verification</span>
            </div>
            <div className="flex flex-col items-center">
              <QrCode size={24} className="text-blue-600 mb-1" />
              <span className="text-xs text-gray-700 font-medium">Dynamic QR</span>
            </div>
            <div className="flex flex-col items-center">
              <Shield size={24} className="text-blue-600 mb-1" />
              <span className="text-xs text-gray-700 font-medium">500m Radius</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">I am a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 font-semibold transition-all shadow-md text-lg tracking-wide select-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                    role === 'student'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 scale-105 shadow-blue-200'
                      : 'border-blue-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <GraduationCap size={24} className="mr-2" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('host')}
                  className={`flex items-center justify-center p-4 rounded-xl border-2 font-semibold transition-all shadow-md text-lg tracking-wide select-none focus:outline-none focus:ring-2 focus:ring-pink-400/50 ${
                    role === 'host'
                      ? 'border-pink-500 bg-gradient-to-br from-pink-100 to-fuchsia-100 text-pink-700 scale-105 shadow-pink-200'
                      : 'border-pink-200 bg-white text-gray-700 hover:border-pink-400 hover:bg-pink-50'
                  }`}
                >
                  <Users size={24} className="mr-2" />
                  Host
                </button>
              </div>
            </div>

            {/* Name Field (Registration only) */}
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-md"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            {/* Toggle Mode */}
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold underline underline-offset-2"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;