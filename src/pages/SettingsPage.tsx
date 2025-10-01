import React, { useState } from 'react';
import { BellIcon, UserIcon, LockIcon, GlobeIcon, PaletteIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const SettingsPage: React.FC = () => {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      // Since name and email are disabled, we don't need to update them
      setSuccess('Profile settings are read-only');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwLoading(true);
    setPwSuccess('');
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      setPwLoading(false);
      return;
    }
    try {
      await authService.changePassword(String(user!.id), oldPassword, newPassword);
      setPwSuccess('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return <div className="px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Settings
        </h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage your account and application preferences
        </p>
      </div>
      <div className="mt-8">
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Profile Settings
                </h3>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input 
                    type="text" 
                    value={username} 
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm" 
                    placeholder="Your name" 
                  />
                  <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm" 
                    placeholder="you@example.com" 
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Profile Information
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Name and email are managed by your administrator and cannot be changed here.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <LockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Security
                </h3>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {/* Password Change Form */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Old password"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="New password"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {pwLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  {pwSuccess && <span className="text-green-600 text-sm">{pwSuccess}</span>}
                  {pwError && <span className="text-red-600 text-sm">{pwError}</span>}
                </div>
                {/* End Password Change Form */}
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                    <span className="ml-2 text-sm text-gray-900">
                      Enable two-factor authentication
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          {/* Notifications */}
          <div className="bg-white shadow rounded-lg" hidden>
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Notifications
                </h3>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {['Email notifications', 'Push notifications', 'SMS notifications'].map(item => <div key={item} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input type="checkbox" className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">
                        {item}
                      </label>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
          {/* Display Settings */}
          <div className="bg-white shadow rounded-lg" hidden>
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center">
                <PaletteIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Display
                </h3>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md">
                    <option>Light</option>
                    <option>Dark</option>
                    <option>System</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default SettingsPage;