import React, { useState, useEffect } from 'react';
import { 
  Smartphone,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Battery,
  Wifi,
  WifiOff,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import deviceService from '../../services/deviceService';
import firebaseDeviceService from '../../services/firebaseDeviceService';
import { adminService } from '../../services/adminService';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [realtimeData, setRealtimeData] = useState({});

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
    
    return () => {
      firebaseDeviceService.cleanup();
    };
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, searchTerm, statusFilter, assignmentFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesData, usersData] = await Promise.all([
        deviceService.getAllDevices(),
        adminService.getAllUsers()
      ]);
      
      setDevices(devicesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to device status updates
    firebaseDeviceService.subscribeToDeviceStatuses((firebaseDevices) => {
      setDevices(prevDevices => 
        prevDevices.map(device => {
          const firebaseDevice = firebaseDevices.find(fd => fd.id === device.id);
          if (firebaseDevice) {
            return {
              ...device,
              status: firebaseDevice.status,
              battery_level: firebaseDevice.batteryLevel,
              last_seen: new Date(firebaseDevice.lastSeen).toISOString()
            };
          }
          return device;
        })
      );
    });

    // Subscribe to real-time sensor data for active devices
    devices.forEach(device => {
      if (device.status === 'active') {
        firebaseDeviceService.subscribeToSensorData(device.id, (data) => {
          setRealtimeData(prev => ({
            ...prev,
            [device.id]: data
          }));
        });
      }
    });
  };

  const filterDevices = () => {
    let filtered = devices;

    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'assigned') {
        filtered = filtered.filter(device => device.assigned_user_id);
      } else if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(device => !device.assigned_user_id);
      }
    }

    setFilteredDevices(filtered);
  };

  const handleAssignDevice = async (deviceId, userId) => {
    try {
      const result = await deviceService.assignDeviceToUser(deviceId, userId);
      if (result.success) {
        await loadData();
        await adminService.logActivity(
          'admin',
          'Device Assignment',
          `Device ${deviceId} assigned to user ${userId}`
        );
      }
    } catch (error) {
      console.error('Error assigning device:', error);
    }
  };

  const handleUnassignDevice = async (deviceId) => {
    try {
      const result = await deviceService.unassignDeviceFromUser(deviceId);
      if (result.success) {
        await loadData();
        await adminService.logActivity(
          'admin',
          'Device Unassignment',
          `Device ${deviceId} unassigned`
        );
      }
    } catch (error) {
      console.error('Error unassigning device:', error);
    }
  };

  const handleBulkAssign = async () => {
    // Implementation for bulk assignment
    console.log('Bulk assign devices:', selectedDevices);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'inactive':
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case 'available':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
      case 'offline':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'available':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const DeviceCard = ({ device }) => {
    const sensorData = realtimeData[device.id];
    const isOnline = device.status === 'active' || device.status === 'online';
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Smartphone className={`w-5 h-5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{device.serial_number || device.id}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{device.device_type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
              {getStatusIcon(device.status)}
              <span className="ml-1">{device.status}</span>
            </span>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Battery className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {device.battery_level || 0}% Battery
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Real-time sensor data */}
        {sensorData && isOnline && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Live Sensor Data</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Heart Rate:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {Math.round(sensorData.heartRate)} BPM
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Temp:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {sensorData.bodyTemperature?.toFixed(1)}°C
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Skin Cond:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {sensorData.skinConductance?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last Update:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {new Date(sensorData.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* User assignment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {device.assigned_user_id ? (
              <>
                <UserCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {device.user_profiles?.email || `User ${device.assigned_user_id.slice(0, 8)}...`}
                </span>
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setSelectedDevice(device);
                setShowAssignModal(true);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              title={device.assigned_user_id ? 'Reassign device' : 'Assign device'}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage IoT devices, assignments, and real-time data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="available">Available</option>
            </select>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>

      {filteredDevices.length === 0 && !loading && (
        <div className="text-center py-12">
          <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No devices found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' || assignmentFilter !== 'all'
              ? 'No devices match your current filters.'
              : 'Get started by adding your first device.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </button>
        </div>
      )}

      {/* Selected devices actions */}
      {selectedDevices.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedDevices.length} selected
            </span>
            <button
              onClick={handleBulkAssign}
              className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
            >
              Bulk Assign
            </button>
            <button
              onClick={() => setSelectedDevices([])}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Modals would go here */}
      {/* AddDeviceModal, AssignDeviceModal, etc. */}
    </div>
  );
};

export default DeviceManagement;