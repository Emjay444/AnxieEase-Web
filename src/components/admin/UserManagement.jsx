import React, { useState, useEffect } from 'react';
import { 
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Plus,
  Activity,
  Clock,
  Smartphone
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import deviceService from '../../services/deviceService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, assignmentFilter, activeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, devicesData] = await Promise.all([
        adminService.getAllUsers(),
        deviceService.getAllDevices()
      ]);
      
      setUsers(usersData);
      setDevices(devicesData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.contact_number?.includes(searchTerm)
      );
    }

    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'assigned') {
        filtered = filtered.filter(user => user.assigned_psychologist_id);
      } else if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(user => !user.assigned_psychologist_id);
      }
    }

    if (activeFilter !== 'all') {
      if (activeFilter === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (activeFilter === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleAssignPsychologist = async (userId, psychologistId) => {
    try {
      const result = await adminService.assignPatientToPsychologist(userId, psychologistId);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error assigning psychologist:', error);
    }
  };

  const getAssignedDevice = (userId) => {
    return devices.find(device => device.assigned_user_id === userId);
  };

  const UserCard = ({ user }) => {
    const assignedDevice = getAssignedDevice(user.id);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{user.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.is_active 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedUser(user);
              setShowUserModal(true);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* User details */}
        <div className="space-y-2 mb-4 text-sm">
          {user.contact_number && user.contact_number !== 'No contact number' && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Phone className="w-4 h-4" />
              <span>{user.contact_number}</span>
            </div>
          )}
          {user.birth_date && user.birth_date !== 'Not specified' && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>{new Date(user.birth_date).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span>Joined {user.date_added}</span>
          </div>
        </div>

        {/* Psychologist assignment */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {user.assigned_psychologist_id ? (
                <>
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Assigned Psychologist</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.assigned_psychologist_name || `ID: ${user.assigned_psychologist_id.slice(0, 8)}...`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">No psychologist assigned</span>
                </>
              )}
            </div>
            <button
              onClick={() => {/* Handle assignment */}}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device assignment */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {assignedDevice ? (
                <>
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Device Assigned</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {assignedDevice.serial_number || assignedDevice.id}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">No device assigned</span>
                </>
              )}
            </div>
            {assignedDevice && (
              <div className={`w-2 h-2 rounded-full ${
                assignedDevice.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const UserTableRow = ({ user }) => {
    const assignedDevice = getAssignedDevice(user.id);
    
    return (
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'Unknown'}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {user.contact_number !== 'No contact number' ? user.contact_number : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {user.assigned_psychologist_name || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {assignedDevice ? (
            <div className="flex items-center space-x-2">
              <span>{assignedDevice.serial_number || assignedDevice.id}</span>
              <div className={`w-2 h-2 rounded-full ${
                assignedDevice.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
            </div>
          ) : (
            '-'
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {user.date_added}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedUser(user);
                setShowUserModal(true);
              }}
              className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, assignments, and monitor activity across the platform
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
          <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'table'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-emerald-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => u.assigned_psychologist_id).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Smartphone className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Devices</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {users.filter(u => getAssignedDevice(u.id)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Psychologist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <UserTableRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || assignmentFilter !== 'all' || activeFilter !== 'all'
              ? 'No users match your current filters.'
              : 'No users have been registered yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;