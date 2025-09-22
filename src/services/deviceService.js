import { supabase } from './supabaseClient';

// Single device configuration for AnxieEase001
const DEVICE_ID = 'AnxieEase001';

class DeviceService {
  // Get the single device with current user assignment
  async getDeviceStatus() {
    try {
      // Get device assignment from wearable_devices table
      const { data: device, error: deviceError } = await supabase
        .from('wearable_devices')
        .select('*')
        .eq('device_id', DEVICE_ID)
        .single();

      if (deviceError && deviceError.code !== 'PGRST116') {
        console.error('Error fetching device:', deviceError);
        return this.getMockDeviceStatus();
      }

      // If device has a user assigned, get user details
      let assignedUser = null;
      if (device?.user_id) {
        const { data: user, error: userError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, email')
          .eq('id', device.user_id)
          .single();

        if (!userError) {
          assignedUser = user;
        }
      }

      return {
        device_id: DEVICE_ID,
        device_name: 'AnxieEase Sensor #001',
        status: device?.user_id ? 'assigned' : 'available',
        assigned_user: assignedUser,
        linked_at: device?.linked_at,
        last_seen_at: device?.last_seen_at,
        battery_level: device?.battery_level || null,
        is_active: device?.is_active ?? true
      };

    } catch (error) {
      console.error('Error in getDeviceStatus:', error);
      return this.getMockDeviceStatus();
    }
  }

  // Get all available users for assignment
  async getAvailableUsers() {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'patient')
        .order('first_name');

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return users || [];

    } catch (error) {
      console.error('Error in getAvailableUsers:', error);
      return [];
    }
  }

  // Assign device to a user
  async assignDeviceToUser(userId) {
    try {
      // First, ensure device exists in wearable_devices table
      const { data: existingDevice } = await supabase
        .from('wearable_devices')
        .select('device_id')
        .eq('device_id', DEVICE_ID)
        .single();

      if (!existingDevice) {
        // Create device record if it doesn't exist
        await supabase
          .from('wearable_devices')
          .insert({
            device_id: DEVICE_ID,
            device_name: 'AnxieEase Sensor #001',
            user_id: userId,
            linked_at: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } else {
        // Update existing device
        await supabase
          .from('wearable_devices')
          .update({
            user_id: userId,
            linked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('device_id', DEVICE_ID);
      }

      // Update user profile to link device
      await supabase
        .from('user_profiles')
        .update({
          device_id: DEVICE_ID,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return { success: true };

    } catch (error) {
      console.error('Error assigning device:', error);
      throw new Error(`Failed to assign device: ${error.message}`);
    }
  }

  // Remove device access from current user
  async removeDeviceAccess() {
    try {
      // Get current user to update their profile
      const { data: device } = await supabase
        .from('wearable_devices')
        .select('user_id')
        .eq('device_id', DEVICE_ID)
        .single();

      // Clear device assignment
      await supabase
        .from('wearable_devices')
        .update({
          user_id: null,
          linked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', DEVICE_ID);

      // Clear device from user profile if user exists
      if (device?.user_id) {
        await supabase
          .from('user_profiles')
          .update({
            device_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', device.user_id);
      }

      return { success: true };

    } catch (error) {
      console.error('Error removing device access:', error);
      throw new Error(`Failed to remove device access: ${error.message}`);
    }
  }

  // Get device usage statistics
  async getDeviceStats() {
    try {
      const deviceStatus = await this.getDeviceStatus();
      const allUsers = await this.getAvailableUsers();

      return {
        total_devices: 1,
        device_status: deviceStatus.status,
        assigned_user: deviceStatus.assigned_user?.first_name + ' ' + deviceStatus.assigned_user?.last_name || null,
        total_users: allUsers.length,
        available_users: allUsers.filter(user => user.id !== deviceStatus.assigned_user?.id).length
      };

    } catch (error) {
      console.error('Error in getDeviceStats:', error);
      return {
        total_devices: 1,
        device_status: 'unknown',
        assigned_user: null,
        total_users: 0,
        available_users: 0
      };
    }
  }

  // Mock data for development
  getMockDeviceStatus() {
    return {
      device_id: DEVICE_ID,
      device_name: 'AnxieEase Sensor #001',
      status: 'available',
      assigned_user: null,
      linked_at: null,
      last_seen_at: null,
      battery_level: 85,
      is_active: true
    };
  }
}

// Create singleton instance
const deviceService = new DeviceService();

export default deviceService;