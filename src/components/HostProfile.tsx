import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Home, GraduationCap, BadgeCheck, Save, Edit3, X } from 'lucide-react';

const HostProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [id, setId] = useState(user?.id || '');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [graduation, setGraduation] = useState(user?.graduation || '');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Handle profile photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setError('');
    setMessage('');
    if (setUser && user) {
      setUser({
        id,
        role: user.role,
        name,
        email,
        address,
        graduation
      });
      setMessage('Profile updated!');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setId(user?.id || '');
    setName(user?.name || '');
    setEmail(user?.email || '');
    setAddress(user?.address || '');
    setGraduation(user?.graduation || '');
    setIsEditing(false);
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 py-10 px-2">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-3">
            {photo ? (
              <img src={photo} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-purple-200 shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-purple-700 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <Edit3 size={16} />
              </label>
            )}
          </div>
          <div className="flex items-center space-x-4 w-full">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Host Profile</h2>
              <p className="text-gray-500 text-sm">Manage your instructor account</p>
            </div>
            {isEditing ? (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                title="Cancel Edit"
              >
                <X size={18} />
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-purple-500 transition-colors"
                title="Edit Profile"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* ID */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <BadgeCheck size={16} className="mr-2" />
              Instructor ID
            </label>
            {isEditing ? (
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your instructor ID"
                required
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{id}</div>
            )}
          </div>
          {/* Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="mr-2" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
                required
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{name}</div>
            )}
          </div>
          {/* Email */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="mr-2" />
              Email Address
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{email}</div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          {/* Address */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Home size={16} className="mr-2" />
              Home Address
            </label>
            {isEditing ? (
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your home address"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{address}</div>
            )}
          </div>
          {/* Graduation */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <GraduationCap size={16} className="mr-2" />
              Graduation Details
            </label>
            {isEditing ? (
              <input
                type="text"
                value={graduation}
                onChange={e => setGraduation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g. 2025, MSc Computer Science"
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{graduation}</div>
            )}
          </div>
          {/* Action Buttons */}
          {isEditing && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Save size={16} />
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default HostProfile;
