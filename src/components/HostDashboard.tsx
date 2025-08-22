// Use VITE_API_URL from environment, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../contexts/GeolocationContext';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { format, addMinutes } from 'date-fns';
import { 
  QrCode, 
  MapPin, 
  Users, 
  Clock, 
  LogOut, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Download,
  // ...existing code...
} from 'lucide-react';
import AttendanceLogo from '../../attendance-logo.png';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  session_id: string;
  host_id: string;
  host_location_lat: number;
  host_location_lng: number;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_location_lat: number;
  student_location_lng: number;
  distance_meters: number;
  marked_at: string;
}

const HostDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { requestLocation } = useGeolocation();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession && currentSession.is_active) {
        const expiryTime = new Date(currentSession.expires_at);
        const now = new Date();
        const remaining = Math.max(0, expiryTime.getTime() - now.getTime());
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setCurrentSession(prev => prev ? { ...prev, is_active: false } : null);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);


  // Poll attendance records for the current session every 5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchAttendance = async () => {
      if (currentSession && currentSession.session_id) {
        try {
          const res = await fetch(`${API_URL}/attendance/session/${currentSession.session_id}`);
          const data = await res.json();
          const attendanceArray = Array.isArray(data) ? data : [];
          console.log('Fetched attendance:', attendanceArray);
          console.log('Attendance records have IDs:', attendanceArray.map(r => ({ id: r.id, _id: r._id })));
          setAttendance(attendanceArray);
        } catch (err) {
          // Optionally handle error
        }
      }
    };
    if (currentSession && currentSession.is_active) {
      fetchAttendance();
      interval = setInterval(fetchAttendance, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession]);

  const generateSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Try to get host's live location for accurate geofence
      let hostLat: number | undefined;
      let hostLng: number | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
        });
        hostLat = position.coords.latitude;
        hostLng = position.coords.longitude;
      } catch (_) {
        // If location fails, backend will fallback to default
      }

      // Call backend to create session
      const res = await fetch(`${API_URL}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_id: user?.id || 'host', host_location_lat: hostLat, host_location_lng: hostLng })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');
      // Generate QR code as a JSON string for student scanner compatibility
      const qrData = JSON.stringify({ sessionId: data.session_id });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1E40AF',
          light: '#FFFFFF'
        }
      });
      setCurrentSession(data);
      setQrCodeUrl(qrCodeDataUrl);
      setAttendance([]);
      setTimeRemaining(5 * 60 * 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate session');
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  }, [user, currentSession]);

  const endSession = async () => {
    if (!currentSession) return;
    try {
      const res = await fetch(`${API_URL}/session/${currentSession.session_id}/end`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to end session');
      }
      setCurrentSession(prev => prev ? { ...prev, is_active: false } : null);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const exportAttendance = () => {
    if (!attendance.length) return;

    const csv = [
      'Student Name,Email,Location,Distance (m),Time Marked',
      ...attendance.map(record => {
        // Format as plain text to avoid Excel auto-formatting
        const timeMarked = format(new Date(record.marked_at), 'yyyy-MM-dd HH:mm:ss');
        return `"${record.student_name}","N/A","${record.student_location_lat},${record.student_location_lng}",${record.distance_meters.toFixed(1)},="${timeMarked}"`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-blue-200 shadow overflow-hidden">
                <img src={AttendanceLogo} alt="Attendance Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">Host<br/>Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/host/profile')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none border border-gray-300 rounded-lg bg-white shadow-sm"
              >
                <span>Profile</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none border border-gray-300 rounded-lg bg-white shadow-sm"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Session Generation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Session Management</h2>
            {currentSession?.is_active && (
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock size={18} />
                <span className="font-mono font-medium">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-red-600 mr-2" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {locationLoading && (
            <div className="text-center py-8">
              <LoadingSpinner message="Getting your location..." />
            </div>
          )}

          {!currentSession?.is_active ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">Generate a new QR code for your session</p>
              <button
                onClick={generateSession}
                disabled={loading}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <QrCode size={18} />
                <span>{loading ? 'Generating...' : 'Generate QR Code'}</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Display */}
              <div className="text-center">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 inline-block">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Session QR Code" className="w-64 h-64 mx-auto" />
                  ) : (
                    <LoadingSpinner />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Students scan this code to mark attendance
                </p>
                <div className="flex justify-center space-x-2 mt-4">
                  <button
                    onClick={generateSession}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <RefreshCw size={16} />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={endSession}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <span>End Session</span>
                  </button>
                </div>
              </div>

              {/* Session Info */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Session Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Session ID:</span>
                      <span className="text-blue-900 font-mono">{currentSession.session_id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Started:</span>
                      <span className="text-blue-900">{format(new Date(currentSession.created_at), 'HH:mm:ss')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Expires:</span>
                      <span className="text-blue-900">{format(new Date(currentSession.expires_at), 'HH:mm:ss')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin size={16} className="text-green-600" />
                    <h3 className="font-medium text-green-900">Location Verified</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Students within 500m of your location can mark attendance
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-yellow-600" />
                    <h3 className="font-medium text-yellow-900">
                      {attendance.length} Students Present
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attendance List */}
        {attendance.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Live Attendance</h2>
              <button
                onClick={exportAttendance}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="space-y-3">
              {attendance.map((record, index) => (
                <div
                  key={record.id || `attendance-${index}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={18} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{record.student_name}</h3>
                      <p className="text-sm text-gray-600">
                        {record.distance_meters.toFixed(1)}m away • {format(new Date(record.marked_at), 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <MapPin size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
