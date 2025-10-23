import { supabase } from "./supabaseClient";

// Single device configuration for AnxieEase001
const DEVICE_ID = "AnxieEase001";

class DeviceService {
  // Get the single device with current user assignment
  async getDeviceStatus() {
    try {
      // Look for the base device (AnxieEase001)
      const { data: device, error: deviceError } = await supabase
        .from("wearable_devices")
        .select(
          `
          device_id,
          device_name,
          user_id,
          linked_at,
          status,
          battery_level,
          last_seen_at,
          user_profiles (
            id,
            first_name,
            last_name
          )
        `
        )
        .eq("device_id", DEVICE_ID)
        .single();

      if (deviceError && deviceError.code !== "PGRST116") {
        console.error("Error fetching device:", deviceError);
        return this.getMockDeviceStatus();
      }

      if (!device) {
        // No device found, return available status
        return {
          device_id: DEVICE_ID,
          device_name: "AnxieEase Sensor #001",
          status: "available",
          assigned_user: null,
          linked_at: null,
          battery_level: 100,
          last_seen_at: null,
        };
      }

      // Sanitize legacy names like "AnxieEase Sensor #001 (User: abcdefg)"
      const cleanName =
        (device.device_name || "")
          .replace(/\s*\(User:\s*[^)]+\)\s*$/i, "")
          .trim() || "AnxieEase Sensor #001";

      // Use joined profile only if it has actual name fields
      let assignedProfile =
        device.user_profiles &&
        (device.user_profiles.first_name || device.user_profiles.last_name)
          ? device.user_profiles
          : null;
      // Fallback: if user_id exists but join returned empty/missing names, fetch profile directly
      if (!assignedProfile && device.user_id) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name")
          .eq("id", device.user_id)
          .single();
        assignedProfile = profile || null;
      }

      // Build a safe full name string if we have a profile
      const assignedUserName = assignedProfile
        ? `${assignedProfile.first_name ?? ""} ${
            assignedProfile.last_name ?? ""
          }`.trim() || null
        : null;

      return {
        device_id: device.device_id,
        device_name: cleanName,
        status: device.user_id ? "assigned" : "available",
        assigned_user: assignedProfile,
        assigned_user_name: assignedUserName,
        linked_at: device.linked_at,
        battery_level: device.battery_level || 100,
        last_seen_at: device.last_seen_at,
      };
    } catch (error) {
      console.error("Error in getDeviceStatus:", error);
      return this.getMockDeviceStatus();
    }
  }

  // Get all available users for assignment
  async getAvailableUsers() {
    try {
      const { data: users, error } = await supabase
        .from("user_profiles")
        .select(
          "id, first_name, last_name, middle_name, email, avatar_url, role"
        )
        .eq("role", "patient")
        .order("first_name");

      if (error) {
        console.error("Error fetching users:", error);
        return [];
      }

      return users || [];
    } catch (error) {
      console.error("Error in getAvailableUsers:", error);
      return [];
    }
  }

  // Assign device to a user
  async assignDeviceToUser(userId) {
    try {
      // First, check if AnxieEase001 base device exists (from physical device setup)
      const { data: existingDevice } = await supabase
        .from("wearable_devices")
        .select("device_id, device_name")
        .eq("device_id", DEVICE_ID)
        .single();

      if (existingDevice) {
        // First, let's see what baselines exist and debug the UUID matching
        const { data: allBaselines } = await supabase
          .from("baseline_heart_rates")
          .select("user_id, baseline_hr")
          .order("recording_end_time", { ascending: false });

        console.log("All baselines in system:", allBaselines);
        console.log("Looking for user ID:", userId);
        console.log("User ID type:", typeof userId);

        // Try to find a matching baseline with more flexible matching
        const matchingBaseline = allBaselines?.find(
          (b) =>
            b.user_id === userId ||
            b.user_id?.toString() === userId?.toString() ||
            b.user_id?.startsWith(userId?.substring(0, 20)) ||
            userId?.startsWith(b.user_id?.substring(0, 20))
        );

        console.log("Matching baseline found:", matchingBaseline);

        // Get user's baseline before updating device
        const { data: userBaseline, error: baselineError } = await supabase
          .from("baseline_heart_rates")
          .select("baseline_hr")
          .eq("user_id", userId)
          .order("recording_end_time", { ascending: false })
          .limit(1)
          .single();

        console.log("Baseline lookup for user:", userId);
        console.log("Found baseline:", userBaseline);
        console.log("Baseline error:", baselineError);

        // Use the flexible match if the exact match failed
        const finalBaseline =
          userBaseline?.baseline_hr || matchingBaseline?.baseline_hr || null;
        console.log("Final baseline to use:", finalBaseline);

        // Update the existing device record (from physical setup) with baseline sync
        const { error: updateError } = await supabase
          .from("wearable_devices")
          .update({
            device_name: "AnxieEase Sensor #001", // Keep clean device name
            user_id: userId,
            linked_at: new Date().toISOString(),
            status: "assigned",
            baseline_hr: finalBaseline, // Use the flexible baseline
          })
          .eq("device_id", DEVICE_ID);

        if (updateError) {
          console.error("Error updating existing device:", updateError);
          throw updateError;
        }
      } else {
        // Get user's baseline before creating device record
        const { data: userBaseline, error: baselineError } = await supabase
          .from("baseline_heart_rates")
          .select("baseline_hr")
          .eq("user_id", userId)
          .order("recording_end_time", { ascending: false })
          .limit(1)
          .single();

        console.log("Baseline lookup for new device - user:", userId);
        console.log("Found baseline:", userBaseline);
        console.log("Baseline error:", baselineError);

        // If no base device exists, create one with baseline sync
        const { error: insertError } = await supabase
          .from("wearable_devices")
          .insert({
            device_id: DEVICE_ID,
            device_name: "AnxieEase Sensor #001", // Keep clean device name
            user_id: userId,
            linked_at: new Date().toISOString(),
            status: "assigned",
            baseline_hr: userBaseline?.baseline_hr || null, // Sync baseline immediately
          });

        if (insertError) {
          console.error("Error creating device record:", insertError);
          throw insertError;
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error assigning device:", error);
      throw new Error(`Failed to assign device: ${error.message}`);
    }
  }

  // Remove device access from current user
  async removeDeviceAccess() {
    try {
      // Update the device to remove user assignment but keep the device record
      const { error: updateError } = await supabase
        .from("wearable_devices")
        .update({
          device_name: "AnxieEase Sensor #001", // Reset to clean name
          user_id: null,
          linked_at: null,
          status: "available",
          baseline_hr: null, // Clear baseline when removing user
        })
        .eq("device_id", DEVICE_ID);

      if (updateError) {
        console.error("Error removing device assignment:", updateError);
        throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error("Error removing device access:", error);
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
        assigned_user: deviceStatus.assigned_user
          ? `${deviceStatus.assigned_user.first_name ?? ""} ${
              deviceStatus.assigned_user.last_name ?? ""
            }`.trim() || null
          : null,
        total_users: allUsers.length,
        available_users: deviceStatus.status === "assigned" ? 1 : 0, // Show 1 if device is assigned, 0 if available
      };
    } catch (error) {
      console.error("Error in getDeviceStats:", error);
      return {
        total_devices: 1,
        device_status: "unknown",
        assigned_user: null,
        total_users: 0,
        available_users: 0,
      };
    }
  }

  // Mock data for development
  getMockDeviceStatus() {
    return {
      device_id: DEVICE_ID,
      device_name: "AnxieEase Sensor #001",
      status: "available",
      assigned_user: null,
      linked_at: null,
      last_seen_at: null,
      battery_level: 85,
      is_active: true,
    };
  }
}

// Create singleton instance
const deviceService = new DeviceService();

export default deviceService;
