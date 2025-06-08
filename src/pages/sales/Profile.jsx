import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Key, Save, Edit2, Camera } from 'lucide-react';
import { Layout, Header } from '../../components/layout';
import { Card, Button, Input, Select, Badge } from '../../components/common';
import { salesService } from '../../services/salesService';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    territory: '',
    salesId: '',
    commissionRate: 0,
    weeklyTarget: 0,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const territories = [
    { value: '', label: 'Select Territory' },
    { value: 'Kinshasa', label: 'Kinshasa' },
    { value: 'Lubumbashi', label: 'Lubumbashi' },
    { value: 'Goma', label: 'Goma' },
    { value: 'Bukavu', label: 'Bukavu' },
    { value: 'Mbuji-Mayi', label: 'Mbuji-Mayi' },
    { value: 'Kananga', label: 'Kananga' },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await salesService.getProfile();
      const profile = response.profile || user?.user || {};
      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        territory: profile.territory || '',
        salesId: profile.salesId || '',
        commissionRate: profile.commissionRate || 0.25,
        weeklyTarget: profile.weeklyTarget || 20,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user data from context
      const profile = user?.user || {};
      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        territory: profile.territory || '',
        salesId: profile.salesId || '',
        commissionRate: profile.commissionRate || 0.25,
        weeklyTarget: profile.weeklyTarget || 20,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!profileData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!profileData.email.trim()) newErrors.email = 'Email is required';
    if (!profileData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileData.email && !emailRegex.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';

    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await salesService.updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setChangingPassword(true);
    setErrors({});

    try {
      await salesService.changePassword(passwordData);
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ passwordSubmit: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header 
        title="My Profile"
        subtitle="Manage your account settings and information"
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-sm">{success}</div>
            </div>
          )}

          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-2xl">
                    {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-gray-600">{profileData.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="info">{profileData.salesId}</Badge>
                  <Badge variant="success">{profileData.territory || 'No territory assigned'}</Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sales ID</label>
                    <div className="text-lg font-semibold text-gray-900">{profileData.salesId}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Commission Rate</label>
                    <div className="text-lg font-semibold text-green-600">
                      {(profileData.commissionRate * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Weekly Target</label>
                    <div className="text-lg font-semibold text-blue-600">
                      {profileData.weeklyTarget} customers
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Territory</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {profileData.territory || 'Not assigned'}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Account Status</label>
                    <div className="mt-1">
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Member Since</label>
                    <div className="text-sm text-gray-900">
                      {user?.user?.createdAt ? new Date(user.user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Performance Summary */}
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Customers</span>
                    <span className="font-semibold text-gray-900">--</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Earnings</span>
                    <span className="font-semibold text-green-600">$--</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-blue-600">$--</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="font-semibold text-purple-600">--%</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" className="w-full">
                    View Detailed Analytics
                  </Button>
                </div>
              </Card>

              {/* Help & Support */}
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-3" />
                    Contact Support
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-3" />
                    Call Support
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;