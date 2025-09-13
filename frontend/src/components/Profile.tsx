import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, Edit, Save, X } from 'lucide-react';
import Layout from './layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import type { User as UserType } from '../utils/api';

const Profile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getProfile();
      
      if (response && response.status === 'success' && response.data) {
        const profileData = response.data;
        setProfile(profileData);
        setEditForm({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          phoneNumber: (profileData as any).phone || profileData.phoneNumber || ''
        });
      } else {
        setError('Failed to load profile data');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setEditForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: (profile as any).phone || profile.phoneNumber || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Prepare update data with both phone and phoneNumber for compatibility
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
        phone: editForm.phoneNumber // Backend might expect 'phone' field
      };
      
      const response = await apiClient.updateProfile(updateData);
      
      if (response && response.status === 'success') {
        await fetchProfile(); // Refresh profile data
        setEditing(false);
      } else {
        setError((response as any).message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'patient': 'Patient',
      'doctor': 'Doctor',
      'nurse': 'Nurse',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout title="Profile">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Unable to load profile</div>
          <button 
            onClick={fetchProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-gray-600">{getRoleDisplay(profile.role)}</p>
              </div>
            </div>
            
            {!editing && (
              <button
                onClick={handleEdit}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{profile.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Phone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-gray-900">{(profile as any).phone || profile.phoneNumber || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-gray-900">{getRoleDisplay(profile.role)}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-gray-900">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Edit Mode Actions */}
          {editing && (
            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Account ID</p>
              <p className="text-gray-900 font-mono text-sm">{profile.id}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-gray-900">{formatDate(profile.updatedAt)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Account Status</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                profile.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Account Settings
          </button>
          
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
