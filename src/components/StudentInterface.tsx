import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../contexts/GeolocationContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsQR from 'jsqr';
import { format } from 'date-fns';
import { 
  QrCode, 
  MapPin, 
  LogOut, 
  Camera, 
  CheckCircle, 
  XCircle,
  // ...existing code...
  Clock
} from 'lucide-react';
import AttendanceLogo from '../../attendance-logo.png';
import LoadingSpinner from './LoadingSpinner';
import { Html5QrcodeSupportedFormats } from "html5-qrcode";
// ...existing code...
interface AttendanceResult {
  success: boolean;
  message: string;
  distance?: number;
  timestamp?: string;
}

const StudentInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const { requestLocation } = useGeolocation();
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Handle QR code image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Image upload triggered', file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Failed to get canvas context');
          setResult({ success: false, message: 'Failed to read image.' });
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, img.width, img.height);
        console.log('jsQR result:', code);
        if (code && code.data) {
          await processQRCode(code.data);
        } else {
          setResult({ success: false, message: 'No QR code found in image.' });
        }
      };
      img.onerror = () => {
        console.error('Failed to load image');
        setResult({ success: false, message: 'Failed to load image.' });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } // end handleImageUpload
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  // Initialize QR scanner
  const initializeScanner = useCallback(() => {
    if (scanner) {
      scanner.clear();
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        // formatsToSupport: ["QR_CODE"]
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      },
      false
    );

    html5QrcodeScanner.render(
      async (decodedText) => {
        setIsScanning(false);
        html5QrcodeScanner.clear();
        await processQRCode(decodedText);
      },
      (error) => {
        // Ignore frequent scanning errors
      }
    );

    setScanner(html5QrcodeScanner);
  }, [scanner]);

  // Process scanned QR code
  const processQRCode = async (qrData: string) => {
    setLoading(true);
    setLocationLoading(true);
    setResult(null);
    try {
      // Parse QR code data
      let qr;
      try {
        qr = JSON.parse(qrData);
      } catch (e) {
        setResult({ success: false, message: 'Invalid QR code format.' });
        return;
      }
      // Get geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      // Check for required user fields
      if (!user?.id || !user?.name) {
        setResult({ success: false, message: 'User ID or name missing. Please log in again.' });
        setLoading(false);
        setLocationLoading(false);
        return;
      }
      const requestBody = {
        session_id: qr.sessionId,
        student_id: user.id,
        student_name: user.name,
        student_location_lat: latitude,
        student_location_lng: longitude
      };
      console.log('Sending attendance request:', requestBody);
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse attendance response as JSON:', e);
        setResult({ success: false, message: 'Invalid response from server.' });
        return;
      }
      console.log('Attendance API response:', data);
      if (response.ok && (data.success || data._id)) {
        setResult({
          success: true,
          message: data.message || 'Attendance marked!',
          distance: data.distance_meters || data.distance,
          timestamp: data.timestamp || data.marked_at || new Date().toISOString()
        });
      } else {
        setResult({ success: false, message: data.message || data.error || 'Failed to mark attendance.' });
      }
    } catch (err) {
      console.error('Error in processQRCode:', err);
      setResult({ success: false, message: 'Error processing QR code.' });
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  // Fetch recent attendance records
  const fetchRecentAttendance = useCallback(async () => {
    // TODO: Replace with backend API call to fetch recent attendance
    setRecentAttendance([]);
  }, [user]);

  // Initialize component
  useEffect(() => {
    fetchRecentAttendance();
  }, [fetchRecentAttendance]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    setIsScanning(true);
    setResult(null);
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
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
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">Student<br/>Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.href = '/student/profile'}
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* QR Scanner Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Mark Attendance</h2>
            <p className="text-gray-600">Scan the QR code shown by your instructor</p>
          </div>


          {locationLoading && (
            <div className="text-center py-8">
              <LoadingSpinner message="Getting your location..." />
              <p className="text-sm text-gray-500 mt-2">
                Please ensure location services are enabled
              </p>
            </div>
          )}

          {!isScanning && !locationLoading && (
            <div className="text-center space-y-4">
              <button
                onClick={startScanning}
                disabled={loading}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Camera size={18} />
                <span>{loading ? 'Processing...' : 'Start QR Scanner'}</span>
              </button>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium mt-2"
                >
                  <span>Upload QR Image</span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div id="qr-reader" className="mx-auto max-w-sm"></div>
              <div className="text-center">
                <button
                  onClick={stopScanning}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <XCircle size={20} className="text-red-600" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.message}
                  </p>
                  {result.success && result.distance && result.timestamp && (
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>Distance: {result.distance}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>Time: {format(new Date(result.timestamp), 'HH:mm:ss')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">How it works:</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="text-gray-900 font-medium">Scan QR Code</p>
                <p className="text-gray-600 text-sm">Your instructor will display a unique QR code for the session</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <p className="text-gray-900 font-medium">Location Verification</p>
                <p className="text-gray-600 text-sm">You must be within 500 meters of your instructor</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <p className="text-gray-900 font-medium">Attendance Marked</p>
                <p className="text-gray-600 text-sm">Your attendance will be recorded automatically</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        {recentAttendance.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Attendance</h3>
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {record.sessions?.profiles?.name || 'Session'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(record.marked_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {Math.round(record.distance_meters)}m away
                    </p>
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

export default StudentInterface;