import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Smartphone, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Battery,
  Wifi,
  Clock,
  Heart,
  Thermometer
} from 'lucide-react';
import firebaseDeviceService from '../../services/firebaseDeviceService';
import deviceService from '../../services/deviceService';
import { adminService } from '../../services/adminService';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalUsers: 0,
    activeSessions: 0
  });
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [realtimeData, setRealtimeData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions
      firebaseDeviceService.cleanup();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic statistics
      const [dashboardStats, devices] = await Promise.all([
        adminService.getDashboardStats(),
        deviceService.getAllDevices()
      ]);

      setStats({
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'active').length,
        totalUsers: dashboardStats.patientsCount || 0,
        activeSessions: 0 // Will be updated by real-time subscription
      });

      setDeviceStatuses(devices);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to device statuses
    const unsubscribeDevices = firebaseDeviceService.subscribeToDeviceStatuses((devices) => {
      setDeviceStatuses(devices);
      setStats(prev => ({
        ...prev,
        activeDevices: devices.filter(d => d.status === 'online').length
      }));
    });

    // Subscribe to active sessions
    const unsubscribeSessions = firebaseDeviceService.subscribeToActiveSessions((sessions) => {
      setActiveSessions(sessions);
      setStats(prev => ({
        ...prev,
        activeSessions: sessions.filter(s => s.status === 'active').length
      }));
    });

    // Subscribe to alerts
    const unsubscribeAlerts = firebaseDeviceService.subscribeToAlerts((alertList) => {
      setAlerts(alertList.slice(0, 5)); // Keep only latest 5 alerts
    });

    // Subscribe to real-time sensor data for active devices
    deviceStatuses.forEach(device => {
      if (device.status === 'online') {
        firebaseDeviceService.subscribeToSensorData(device.id, (data) => {
          setRealtimeData(prev => ({
            ...prev,
            [device.id]: data
          }));
        });
      }
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-600 dark:text-green-400 font-medium">{trend}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );

  const DeviceStatusCard = ({ device, sensorData }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            device.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{device.id}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {device.assignedUserId ? `User: ${device.assignedUserId.slice(0, 8)}...` : 'Unassigned'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Battery className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">{device.batteryLevel}%</span>
        </div>
      </div>
      
      {sensorData && device.status === 'online' && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-300">
              {Math.round(sensorData.heartRate)} BPM
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">
              {sensorData.bodyTemperature?.toFixed(1)}°C
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const AlertItem = ({ alert }) => (
    <div className={`p-3 rounded-lg border-l-4 ${
      alert.severity === 'critical' 
        ? 'bg-red-50 border-red-400 dark:bg-red-900/20' 
        : 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`w-4 h-4 ${
            alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
          }`} />
          <span className="font-medium text-gray-900 dark:text-white">
            {alert.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        Device {alert.deviceId}: {alert.type} detected (Value: {alert.value}, Threshold: {alert.threshold})
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time monitoring and system status for AnxieEase IoT devices
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={Smartphone}
          color="bg-blue-500"
          subtitle={`${stats.activeDevices} online`}
          trend="+12%"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Activity}
          color="bg-green-500"
          subtitle="Currently monitoring"
          trend="+8%"
        />
        <StatCard
          title="Registered Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-purple-500"
          subtitle="Total platform users"
          trend="+15%"
        />
        <StatCard
          title="System Health"
          value="99.5%"
          icon={Wifi}
          color="bg-emerald-500"
          subtitle="Uptime this month"
          trend="+0.2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Device Status</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deviceStatuses.slice(0, 6).map((device) => (
                <DeviceStatusCard
                  key={device.id}
                  device={device}
                  sensorData={realtimeData[device.id]}
                />
              ))}
            </div>
            {deviceStatuses.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No devices found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts & Active Sessions */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
            <div className="space-y-3">
              {activeSessions.length > 0 ? (
                activeSessions.slice(0, 5).map((session) => (
                  <div key={`${session.deviceId}-${session.startTime}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.deviceId}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        User: {session.userId?.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(session.duration / 60000)}m</span>
                      </div>
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        session.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active sessions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;