import { database } from './firebaseConfig';
import { ref, onValue, off, push, set, update, remove, query, orderByChild, limitToLast, orderByKey } from 'firebase/database';

// Mock data for development when Firebase is not available
const mockDevices = [
  {
    id: 'device_001',
    status: 'online',
    batteryLevel: 85,
    lastSeen: Date.now(),
    assignedUserId: 'user-1',
    deviceType: 'anxiety_monitor',
    firmwareVersion: '1.2.3'
  },
  {
    id: 'device_002', 
    status: 'offline',
    batteryLevel: 42,
    lastSeen: Date.now() - 300000, // 5 minutes ago
    assignedUserId: 'user-2',
    deviceType: 'anxiety_monitor',
    firmwareVersion: '1.2.3'
  },
  {
    id: 'device_003',
    status: 'online',
    batteryLevel: 91,
    lastSeen: Date.now(),
    assignedUserId: null,
    deviceType: 'anxiety_monitor',
    firmwareVersion: '1.2.2'
  }
];

const mockSensorData = {
  'device_001': {
    heartRate: 72 + Math.random() * 20,
    skinConductance: 0.3 + Math.random() * 0.4,
    bodyTemperature: 36.5 + Math.random() * 1.5,
    accelerometer: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2
    },
    timestamp: Date.now()
  },
  'device_002': {
    heartRate: 68 + Math.random() * 25,
    skinConductance: 0.2 + Math.random() * 0.3,
    bodyTemperature: 36.2 + Math.random() * 1.8,
    accelerometer: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2
    },
    timestamp: Date.now() - 300000
  }
};

const mockActiveSessions = [
  {
    deviceId: 'device_001',
    userId: 'user-1',
    startTime: Date.now() - 1800000, // 30 minutes ago
    status: 'active',
    duration: 1800000
  },
  {
    deviceId: 'device_002',
    userId: 'user-2', 
    startTime: Date.now() - 3600000, // 1 hour ago
    status: 'paused',
    duration: 3600000
  }
];

class FirebaseDeviceService {
  constructor() {
    this.listeners = new Map();
    this.mockMode = false;
    
    // Test Firebase connection
    this.testConnection();
  }

  async testConnection() {
    try {
      const testRef = ref(database, '.info/connected');
      onValue(testRef, (snapshot) => {
        if (snapshot.val() === true) {
          console.log('Firebase Realtime Database connected');
          this.mockMode = false;
        } else {
          console.log('Firebase Realtime Database disconnected, using mock data');
          this.mockMode = true;
        }
      });
    } catch (error) {
      console.log('Firebase connection test failed, using mock data:', error.message);
      this.mockMode = true;
    }
  }

  // Subscribe to all device statuses
  subscribeToDeviceStatuses(callback) {
    if (this.mockMode) {
      // Return mock data and simulate updates
      callback(mockDevices);
      
      // Simulate real-time updates
      const interval = setInterval(() => {
        const updatedDevices = mockDevices.map(device => ({
          ...device,
          batteryLevel: Math.max(0, device.batteryLevel - Math.random() * 2),
          lastSeen: device.status === 'online' ? Date.now() : device.lastSeen
        }));
        callback(updatedDevices);
      }, 5000);
      
      return () => clearInterval(interval);
    }

    try {
      const devicesRef = ref(database, 'devices');
      const unsubscribe = onValue(devicesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const devices = Object.entries(data).map(([id, device]) => ({
            id,
            ...device
          }));
          callback(devices);
        } else {
          callback([]);
        }
      });

      return () => off(devicesRef, 'value', unsubscribe);
    } catch (error) {
      console.error('Error subscribing to device statuses:', error);
      callback([]);
      return () => {};
    }
  }

  // Subscribe to real-time sensor data for a specific device
  subscribeToSensorData(deviceId, callback) {
    if (this.mockMode) {
      // Return mock sensor data and simulate real-time updates
      const interval = setInterval(() => {
        const data = {
          heartRate: 60 + Math.random() * 40,
          skinConductance: 0.1 + Math.random() * 0.8,
          bodyTemperature: 36.0 + Math.random() * 2.0,
          accelerometer: {
            x: (Math.random() - 0.5) * 4,
            y: (Math.random() - 0.5) * 4,
            z: (Math.random() - 0.5) * 4
          },
          timestamp: Date.now()
        };
        callback(data);
      }, 1000);
      
      return () => clearInterval(interval);
    }

    try {
      const sensorRef = ref(database, `device_sessions/${deviceId}/sensorData`);
      const sensorQuery = query(sensorRef, orderByKey(), limitToLast(1));
      
      const unsubscribe = onValue(sensorQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const latestData = Object.values(data)[0];
          callback(latestData);
        }
      });

      return () => off(sensorRef, 'value', unsubscribe);
    } catch (error) {
      console.error('Error subscribing to sensor data:', error);
      return () => {};
    }
  }

  // Subscribe to active device sessions
  subscribeToActiveSessions(callback) {
    if (this.mockMode) {
      callback(mockActiveSessions);
      
      // Simulate updates to active sessions
      const interval = setInterval(() => {
        const updatedSessions = mockActiveSessions.map(session => ({
          ...session,
          duration: Date.now() - session.startTime
        }));
        callback(updatedSessions);
      }, 10000);
      
      return () => clearInterval(interval);
    }

    try {
      const sessionsRef = ref(database, 'device_sessions');
      const activeQuery = query(sessionsRef, orderByChild('status'));
      
      const unsubscribe = onValue(activeQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sessions = Object.entries(data)
            .filter(([_, session]) => session.status === 'active' || session.status === 'paused')
            .map(([deviceId, session]) => ({
              deviceId,
              ...session,
              duration: Date.now() - session.startTime
            }));
          callback(sessions);
        } else {
          callback([]);
        }
      });

      return () => off(sessionsRef, 'value', unsubscribe);
    } catch (error) {
      console.error('Error subscribing to active sessions:', error);
      callback([]);
      return () => {};
    }
  }

  // Get device session history
  async getDeviceSessionHistory(deviceId, limit = 50) {
    if (this.mockMode) {
      // Return mock session history
      return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
        sessionId: `session_${i + 1}`,
        deviceId,
        userId: `user_${(i % 3) + 1}`,
        startTime: Date.now() - (i + 1) * 3600000,
        endTime: Date.now() - i * 3600000,
        duration: 3600000,
        status: 'completed',
        avgHeartRate: 70 + Math.random() * 20,
        avgSkinConductance: 0.3 + Math.random() * 0.4
      }));
    }

    try {
      const historyRef = ref(database, `device_sessions`);
      const historyQuery = query(
        historyRef, 
        orderByChild('deviceId'),
        limitToLast(limit)
      );
      
      const snapshot = await historyQuery.once('value');
      const data = snapshot.val();
      
      if (data) {
        return Object.entries(data)
          .filter(([_, session]) => session.deviceId === deviceId)
          .map(([sessionId, session]) => ({
            sessionId,
            ...session
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting device session history:', error);
      return [];
    }
  }

  // Get user device assignments
  async getUserDeviceAssignments() {
    if (this.mockMode) {
      return {
        'user-1': 'device_001',
        'user-2': 'device_002'
      };
    }

    try {
      const usersRef = ref(database, 'users');
      const snapshot = await usersRef.once('value');
      const data = snapshot.val();
      
      if (data) {
        const assignments = {};
        Object.entries(data).forEach(([userId, userData]) => {
          if (userData.deviceId) {
            assignments[userId] = userData.deviceId;
          }
        });
        return assignments;
      }
      
      return {};
    } catch (error) {
      console.error('Error getting user device assignments:', error);
      return {};
    }
  }

  // Assign device to user
  async assignDeviceToUser(deviceId, userId) {
    if (this.mockMode) {
      console.log(`Mock: Assigned device ${deviceId} to user ${userId}`);
      return { success: true };
    }

    try {
      // Update user's device assignment
      await update(ref(database, `users/${userId}`), {
        deviceId,
        assignedAt: Date.now()
      });

      // Update device's assignment
      await update(ref(database, `devices/${deviceId}`), {
        assignedUserId: userId,
        assignedAt: Date.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning device to user:', error);
      return { success: false, error: error.message };
    }
  }

  // Unassign device from user
  async unassignDeviceFromUser(deviceId, userId) {
    if (this.mockMode) {
      console.log(`Mock: Unassigned device ${deviceId} from user ${userId}`);
      return { success: true };
    }

    try {
      // Remove user's device assignment
      await update(ref(database, `users/${userId}`), {
        deviceId: null,
        assignedAt: null
      });

      // Remove device's assignment
      await update(ref(database, `devices/${deviceId}`), {
        assignedUserId: null,
        assignedAt: null
      });

      return { success: true };
    } catch (error) {
      console.error('Error unassigning device from user:', error);
      return { success: false, error: error.message };
    }
  }

  // Start a monitoring session
  async startSession(deviceId, userId) {
    if (this.mockMode) {
      console.log(`Mock: Started session for device ${deviceId} and user ${userId}`);
      return { success: true, sessionId: `mock-session-${Date.now()}` };
    }

    try {
      const sessionRef = push(ref(database, `device_sessions/${deviceId}`));
      await set(sessionRef, {
        userId,
        startTime: Date.now(),
        status: 'active'
      });

      return { success: true, sessionId: sessionRef.key };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error: error.message };
    }
  }

  // End a monitoring session
  async endSession(deviceId, sessionId) {
    if (this.mockMode) {
      console.log(`Mock: Ended session ${sessionId} for device ${deviceId}`);
      return { success: true };
    }

    try {
      await update(ref(database, `device_sessions/${deviceId}/${sessionId}`), {
        endTime: Date.now(),
        status: 'completed'
      });

      return { success: true };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error: error.message };
    }
  }

  // Get real-time alerts based on sensor thresholds
  subscribeToAlerts(callback) {
    if (this.mockMode) {
      // Simulate occasional alerts
      const interval = setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance of alert every 10 seconds
          const alert = {
            id: `alert_${Date.now()}`,
            deviceId: mockDevices[Math.floor(Math.random() * mockDevices.length)].id,
            type: Math.random() < 0.5 ? 'high_heart_rate' : 'high_skin_conductance',
            severity: Math.random() < 0.3 ? 'critical' : 'warning',
            value: Math.random() < 0.5 ? 120 : 0.8,
            threshold: Math.random() < 0.5 ? 100 : 0.7,
            timestamp: Date.now()
          };
          callback([alert]);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }

    // Implement real Firebase alert monitoring
    // This would monitor sensor data and trigger alerts based on thresholds
    return () => {};
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }
}

// Create singleton instance
const firebaseDeviceService = new FirebaseDeviceService();

export default firebaseDeviceService;