// Enhanced Device Service - Firebase + Supabase Integration
// This bridges your existing Supabase device management with Firebase multi-user sessions

import { supabase } from "./supabaseClient";

// Firebase configuration for web admin
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "anxieease-sensors.firebaseapp.com",
  databaseURL: "https://anxieease-sensors-default-rtdb.firebaseio.com",
  projectId: "anxieease-sensors",
  storageBucket: "anxieease-sensors.appspot.com",
  messagingSenderId: "915581332814",
  appId: "YOUR_FIREBASE_APP_ID"
};

// Initialize Firebase for web
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, onValue } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDB = getDatabase(firebaseApp);
const functions = getFunctions(firebaseApp);

// Cloud Function calls
const assignDeviceToUserFunction = httpsCallable(functions, 'assignDeviceToUser');
const getDeviceAssignmentFunction = httpsCallable(functions, 'getDeviceAssignment');

export const enhancedDeviceService = {
  
  // Enhanced device assignment that creates both Supabase and Firebase sessions
  async assignDeviceToUser(deviceId, userId, expiresAt, adminNotes = null) {
    try {
      console.log('🔄 Starting enhanced device assignment...');
      
      // Step 1: Create/update Supabase assignment (existing functionality)
      const supabaseResult = await this.assignDeviceToUserSupabase(deviceId, userId, expiresAt, adminNotes);
      console.log('✅ Supabase assignment completed');

      // Step 2: Create Firebase user session
      const sessionId = `session_${Date.now()}`;
      const firebaseResult = await this.createFirebaseUserSession(deviceId, userId, sessionId, adminNotes);
      console.log('✅ Firebase session created');

      // Step 3: Update Supabase with Firebase session info
      await this.linkFirebaseSessionToSupabase(deviceId, sessionId);
      console.log('✅ Sessions linked');

      return {
        supabase: supabaseResult,
        firebase: firebaseResult,
        sessionId,
        status: 'success'
      };

    } catch (error) {
      console.error('❌ Enhanced assignment failed:', error);
      
      // Rollback on error
      try {
        await this.rollbackAssignment(deviceId, userId);
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      throw error;
    }
  },

  // Original Supabase assignment (unchanged)
  async assignDeviceToUserSupabase(deviceId, userId, expiresAt, adminNotes = null) {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user?.id) {
      throw new Error("No authenticated admin user");
    }

    const { data, error } = await supabase
      .rpc('assign_device_to_user', {
        device_id: deviceId,
        user_id: userId,
        expires_at: expiresAt,
        admin_notes: adminNotes
      });

    if (error) throw error;
    return data;
  },

  // Create Firebase user session
  async createFirebaseUserSession(deviceId, userId, sessionId, description) {
    try {
      // Set device assignment in Firebase
      const assignmentRef = ref(firebaseDB, `devices/${deviceId}/assignment`);
      await set(assignmentRef, {
        userId: userId,
        sessionId: sessionId,
        assignedAt: Date.now(),
        assignedBy: 'web_admin',
        description: description || 'Web admin assignment',
        status: 'active'
      });

      // Create user session metadata
      const sessionRef = ref(firebaseDB, `users/${userId}/sessions/${sessionId}/metadata`);
      await set(sessionRef, {
        deviceId: deviceId,
        startTime: Date.now(),
        status: 'active',
        description: description || 'Web admin assignment',
        totalDataPoints: 0,
        lastActivity: Date.now(),
        source: 'web_admin'
      });

      return { sessionId, status: 'created' };
    } catch (error) {
      console.error('Firebase session creation failed:', error);
      throw error;
    }
  },

  // Link Firebase session to Supabase record
  async linkFirebaseSessionToSupabase(deviceId, sessionId) {
    try {
      const { error } = await supabase
        .from('wearable_devices')
        .update({ 
          firebase_session_id: sessionId,
          last_firebase_sync: new Date().toISOString()
        })
        .eq('device_id', deviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to link sessions:', error);
      throw error;
    }
  },

  // Enhanced device release that cleans up both systems
  async releaseDeviceAssignment(deviceId) {
    try {
      console.log('🔄 Starting enhanced device release...');

      // Step 1: Get current assignment info
      const device = await this.getDevice(deviceId);
      const firebaseSessionId = device.firebase_session_id;
      const userId = device.user_id;

      // Step 2: Release Supabase assignment
      await this.releaseDeviceAssignmentSupabase(deviceId);
      console.log('✅ Supabase assignment released');

      // Step 3: Complete Firebase session
      if (firebaseSessionId && userId) {
        await this.completeFirebaseSession(deviceId, userId, firebaseSessionId);
        console.log('✅ Firebase session completed');
      }

      return { status: 'success', message: 'Device released from both systems' };

    } catch (error) {
      console.error('❌ Enhanced release failed:', error);
      throw error;
    }
  },

  // Complete Firebase session
  async completeFirebaseSession(deviceId, userId, sessionId) {
    try {
      // Mark session as completed
      const sessionRef = ref(firebaseDB, `users/${userId}/sessions/${sessionId}/metadata/status`);
      await set(sessionRef, 'completed');

      const endTimeRef = ref(firebaseDB, `users/${userId}/sessions/${sessionId}/metadata/endTime`);
      await set(endTimeRef, Date.now());

      // Remove device assignment
      const assignmentRef = ref(firebaseDB, `devices/${deviceId}/assignment`);
      await remove(assignmentRef);

    } catch (error) {
      console.error('Firebase session completion failed:', error);
      throw error;
    }
  },

  // Original Supabase release (unchanged)
  async releaseDeviceAssignmentSupabase(deviceId) {
    const { data, error } = await supabase
      .rpc('release_device_assignment', { device_id: deviceId });
    if (error) throw error;
    return data;
  },

  // Get enhanced device info (Supabase + Firebase)
  async getEnhancedDevice(deviceId) {
    try {
      // Get Supabase device info
      const supabaseDevice = await this.getDevice(deviceId);
      
      // Get Firebase assignment status
      let firebaseAssignment = null;
      let firebaseSessionData = null;
      
      if (supabaseDevice.firebase_session_id) {
        const assignmentRef = ref(firebaseDB, `devices/${deviceId}/assignment`);
        const assignmentSnapshot = await get(assignmentRef);
        firebaseAssignment = assignmentSnapshot.val();

        if (firebaseAssignment) {
          const sessionRef = ref(firebaseDB, `users/${firebaseAssignment.userId}/sessions/${firebaseAssignment.sessionId}`);
          const sessionSnapshot = await get(sessionRef);
          firebaseSessionData = sessionSnapshot.val();
        }
      }

      return {
        ...supabaseDevice,
        firebase: {
          assignment: firebaseAssignment,
          session: firebaseSessionData,
          isActive: !!firebaseAssignment
        }
      };

    } catch (error) {
      console.error('Failed to get enhanced device info:', error);
      throw error;
    }
  },

  // Real-time Firebase data monitoring
  async monitorDeviceData(deviceId, callback) {
    const currentRef = ref(firebaseDB, `devices/${deviceId}/current`);
    
    return onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback({
          type: 'device_data',
          deviceId,
          data,
          timestamp: Date.now()
        });
      }
    });
  },

  // Monitor user session data
  async monitorUserSession(userId, sessionId, callback) {
    const sessionRef = ref(firebaseDB, `users/${userId}/sessions/${sessionId}`);
    
    return onValue(sessionRef, (snapshot) => {
      const sessionData = snapshot.val();
      if (sessionData) {
        callback({
          type: 'session_data',
          userId,
          sessionId,
          data: sessionData,
          timestamp: Date.now()
        });
      }
    });
  },

  // Get Firebase session statistics for admin dashboard
  async getFirebaseSessionStats() {
    try {
      const devicesRef = ref(firebaseDB, 'devices');
      const devicesSnapshot = await get(devicesRef);
      const devices = devicesSnapshot.val() || {};

      const usersRef = ref(firebaseDB, 'users');
      const usersSnapshot = await get(usersRef);
      const users = usersSnapshot.val() || {};

      // Count active assignments
      let activeAssignments = 0;
      Object.values(devices).forEach(device => {
        if (device.assignment) activeAssignments++;
      });

      // Count total sessions
      let totalSessions = 0;
      let activeSessions = 0;
      Object.values(users).forEach(user => {
        if (user.sessions) {
          totalSessions += Object.keys(user.sessions).length;
          Object.values(user.sessions).forEach(session => {
            if (session.metadata?.status === 'active') activeSessions++;
          });
        }
      });

      return {
        activeAssignments,
        totalSessions,
        activeSessions,
        completedSessions: totalSessions - activeSessions
      };

    } catch (error) {
      console.error('Failed to get Firebase stats:', error);
      return { activeAssignments: 0, totalSessions: 0, activeSessions: 0, completedSessions: 0 };
    }
  },

  // Rollback failed assignment
  async rollbackAssignment(deviceId, userId) {
    console.log('🔄 Rolling back assignment...');
    
    try {
      // Remove Firebase assignment
      const assignmentRef = ref(firebaseDB, `devices/${deviceId}/assignment`);
      await remove(assignmentRef);
    } catch (e) {
      console.error('Firebase rollback failed:', e);
    }

    try {
      // Release Supabase assignment
      await this.releaseDeviceAssignmentSupabase(deviceId);
    } catch (e) {
      console.error('Supabase rollback failed:', e);
    }
  },

  // Inherit all original methods
  ...deviceService
};

// Export enhanced service as default
export { enhancedDeviceService as deviceService };