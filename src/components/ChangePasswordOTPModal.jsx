import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { immediatePasswordService } from '../services/immediatePasswordService';

const ChangePasswordOTPModal = ({ 
  isOpen, 
  onClose, 
  userEmail,
  onSuccess,
  onError 
}) => {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP & Change Password
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        otp: ''
      });
      setError('');
      setOtpSent(false);
    }
  }, [isOpen]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Validate password requirements
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const isPasswordValid = (password) => {
    const reqs = validatePassword(password);
    return Object.values(reqs).every(Boolean);
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!formData.currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (!formData.newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (!isPasswordValid(formData.newPassword)) {
      setError('New password does not meet security requirements');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await immediatePasswordService.sendPasswordChangeOTP(userEmail);
      setOtpSent(true);
      setStep(2);
    } catch (error) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and update password
  const handleVerifyAndUpdate = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit OTP from your email');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await immediatePasswordService.updatePasswordWithOTP(
        userEmail,
        formData.otp,
        formData.newPassword,
        formData.currentPassword
      );

      // Success callback
      onSuccess && onSuccess('Password updated successfully with OTP verification!');
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to update password');
      onError && onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
    setFormData(prev => ({ ...prev, otp: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                {step === 1 ? 'Secure Password Change' : 'Verify OTP'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Password Form */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                For enhanced security, we'll send an OTP to verify your identity
              </p>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleFormChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter current password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleFormChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.newPassword && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                  {Object.entries(validatePassword(formData.newPassword)).map(([key, met]) => (
                    <div key={key} className={`flex items-center text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {key === 'length' && 'At least 8 characters'}
                      {key === 'uppercase' && 'One uppercase letter'}
                      {key === 'lowercase' && 'One lowercase letter'}
                      {key === 'number' && 'One number'}
                      {key === 'special' && 'One special character'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Send OTP Button */}
            <button
              onClick={handleSendOTP}
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword || !isPasswordValid(formData.newPassword)}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send OTP to Email</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                OTP sent to <strong>{userEmail}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code to complete password change
              </p>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => handleFormChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                maxLength="6"
                disabled={loading}
              />
            </div>

            {/* Verify and Update Button */}
            <button
              onClick={handleVerifyAndUpdate}
              disabled={loading || formData.otp.length !== 6}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify & Update Password</span>
                </>
              )}
            </button>

            {/* Resend OTP */}
            <button
              onClick={() => {
                setStep(1);
                setFormData(prev => ({ ...prev, otp: '' }));
              }}
              disabled={loading}
              className="w-full px-4 py-2 text-emerald-600 hover:text-emerald-700 transition-colors text-sm"
            >
              Didn't receive OTP? Go back to resend
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordOTPModal;