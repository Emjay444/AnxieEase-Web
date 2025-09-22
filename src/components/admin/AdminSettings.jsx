import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Database,
  Wifi,
  Users,
  Smartphone,
  AlertTriangle,
  Check,
  X,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      systemName: 'AnxieEase Admin Dashboard',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      autoRefresh: true,
      refreshInterval: 30
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      alertThresholds: {
        heartRateHigh: 120,
        heartRateLow: 50,
        skinConductanceHigh: 0.8,
        temperatureHigh: 38.5,
        temperatureLow: 35.0
      },
      alertRecipients: ['admin@anxieease.com']
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      passwordMinLength: 8,
      passwordRequireSpecial: true
    },
    database: {
      backupFrequency: 'daily',
      retentionPeriod: 365,
      compressionEnabled: true,
      encryptionEnabled: true
    },
    devices: {
      maxDevicesPerUser: 1,
      defaultBatteryThreshold: 20,
      connectionTimeout: 300,
      dataRetentionDays: 90
    }
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadActivityLogs();
  }, []);

  const loadActivityLogs = async () => {
    try {
      const logs = await adminService.getActivityLogs();
      setActivityLogs(logs.slice(0, 10)); // Show last 10 activities
    } catch (error) {
      console.error('Error loading activity logs:', error);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (category, parentKey, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parentKey]: {
          ...prev[category][parentKey],
          [key]: value
        }
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Here you would typically save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      await adminService.logActivity(
        'admin',
        'Settings Updated',
        `System settings updated for tab: ${activeTab}`
      );
      
      // Show success notification
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anxieease-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          console.log('Settings imported successfully');
        } catch (error) {
          console.error('Error importing settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      // Reset settings to default values
      setSettings({
        general: {
          systemName: 'AnxieEase Admin Dashboard',
          timezone: 'Asia/Manila',
          dateFormat: 'MM/DD/YYYY',
          autoRefresh: true,
          refreshInterval: 30
        },
        // ... other default settings
      });
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'devices', name: 'Devices', icon: Smartphone },
    { id: 'activity', name: 'Activity Logs', icon: Activity }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          System Name
        </label>
        <input
          type="text"
          value={settings.general.systemName}
          onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="Asia/Manila">Asia/Manila</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Format
          </label>
          <select
            value={settings.general.dateFormat}
            onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto Refresh Dashboard
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Automatically refresh dashboard data
          </p>
        </div>
        <button
          onClick={() => handleSettingChange('general', 'autoRefresh', !settings.general.autoRefresh)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.general.autoRefresh ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            settings.general.autoRefresh ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {settings.general.autoRefresh && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Refresh Interval (seconds)
          </label>
          <input
            type="number"
            min="10"
            max="300"
            value={settings.general.refreshInterval}
            onChange={(e) => handleSettingChange('general', 'refreshInterval', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Alerts
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Send alerts via email
          </p>
        </div>
        <button
          onClick={() => handleSettingChange('notifications', 'emailAlerts', !settings.notifications.emailAlerts)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.notifications.emailAlerts ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            settings.notifications.emailAlerts ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Alert Thresholds
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Heart Rate High (BPM)
            </label>
            <input
              type="number"
              value={settings.notifications.alertThresholds.heartRateHigh}
              onChange={(e) => handleNestedSettingChange('notifications', 'alertThresholds', 'heartRateHigh', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Heart Rate Low (BPM)
            </label>
            <input
              type="number"
              value={settings.notifications.alertThresholds.heartRateLow}
              onChange={(e) => handleNestedSettingChange('notifications', 'alertThresholds', 'heartRateLow', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Skin Conductance High
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.notifications.alertThresholds.skinConductanceHigh}
              onChange={(e) => handleNestedSettingChange('notifications', 'alertThresholds', 'skinConductanceHigh', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Temperature High (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.notifications.alertThresholds.temperatureHigh}
              onChange={(e) => handleNestedSettingChange('notifications', 'alertThresholds', 'temperatureHigh', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Session Timeout (seconds)
        </label>
        <input
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Maximum Login Attempts
        </label>
        <input
          type="number"
          value={settings.security.maxLoginAttempts}
          onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Require Two-Factor Authentication
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Require 2FA for admin accounts
          </p>
        </div>
        <button
          onClick={() => handleSettingChange('security', 'requireTwoFactor', !settings.security.requireTwoFactor)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.security.requireTwoFactor ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            settings.security.requireTwoFactor ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  );

  const renderActivityLogs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        <button
          onClick={loadActivityLogs}
          className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {activityLogs.map((log, index) => (
          <div key={log.id || index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{log.action}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.details}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {activityLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'activity':
        return renderActivityLogs();
      default:
        return <div>Tab content for {activeTab}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure system settings, notifications, and security preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportSettings}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <label className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import
            <input type="file" accept=".json" onChange={importSettings} className="hidden" />
          </label>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;