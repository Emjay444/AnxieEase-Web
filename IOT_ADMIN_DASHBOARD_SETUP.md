# AnxieEase IoT Admin Dashboard Setup Guide

## Overview
The comprehensive admin dashboard for AnxieEase provides real-time monitoring of IoT anxiety sensors, user management, device assignment, and analytics. It integrates Firebase Realtime Database for IoT data with the existing Supabase backend.

## Features Implemented
✅ **Real-time IoT Monitoring** - Live sensor data from anxiety monitoring devices
✅ **Device Management** - Device inventory, assignments, health monitoring
✅ **User Management** - User profiles, activity tracking, device assignments
✅ **Analytics Dashboard** - Charts for usage statistics, device utilization, anxiety trends
✅ **Admin Controls** - Settings, alert thresholds, activity logging
✅ **Responsive Design** - Dark/light mode, mobile-friendly interface

## Access the Dashboard
- **URL**: `/admin-iot` (requires admin privileges)
- **Existing Admin Panel**: `/admin` (unchanged - handles user/psychologist management)

## Firebase Configuration

### 1. Set up Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the `anxieease-sensors` project
3. Navigate to Project Settings > General > Your apps
4. Copy the configuration values

### 2. Update Environment Variables
Edit `.env` file and replace these Firebase values:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

The following are already configured:
- Database URL: `https://anxieease-sensors-default-rtdb.asia-southeast1.firebasedatabase.app`
- Project ID: `anxieease-sensors`
- Auth Domain: `anxieease-sensors.firebaseapp.com`

### 3. Firebase Database Structure
The dashboard expects this structure in Firebase Realtime Database:

```json
{
  "device_sessions": {
    "device_001": {
      "current_session": {
        "session_id": "session_123",
        "user_id": "user_456",
        "start_time": "2024-01-15T10:00:00Z",
        "status": "active",
        "sensor_data": {
          "heart_rate": 75,
          "skin_conductance": 2.5,
          "temperature": 36.5,
          "accelerometer": {
            "x": 0.1, "y": 0.2, "z": 9.8
          },
          "timestamp": "2024-01-15T10:05:00Z"
        }
      },
      "device_info": {
        "model": "AnxieEase Sensor v2",
        "firmware_version": "1.2.3",
        "battery_level": 85,
        "last_seen": "2024-01-15T10:05:00Z",
        "status": "online"
      }
    }
  },
  "users": {
    "user_456": {
      "sessions": {
        "session_123": {
          "start_time": "2024-01-15T10:00:00Z",
          "end_time": null,
          "device_id": "device_001",
          "status": "active"
        }
      },
      "preferences": {
        "alert_thresholds": {
          "heart_rate_max": 100,
          "stress_level_max": 7
        }
      }
    }
  }
}
```

## Supabase Integration
The dashboard uses existing Supabase tables and services:

### Required Tables
- `user_profiles` - User information and preferences
- `devices` - Device inventory and specifications
- `device_assignments` - User-device assignment tracking
- `admin_activity_logs` - Admin action logging

### Services Used
- `adminService.js` - User management and analytics
- `deviceService.js` - Device CRUD operations
- `supabaseClient.js` - Database connection

## Development Mode
The dashboard includes mock data for development when Firebase is not available:

1. **Enable Mock Mode**: Set `VITE_FIREBASE_USE_EMULATOR=true` in `.env`
2. **Mock Data**: Includes sample devices, users, and sensor readings
3. **Emulator Support**: Can connect to Firebase emulator for testing

## Component Architecture

### Main Components
- `AdminDashboard.jsx` - Main dashboard container with navigation
- `admin/DashboardOverview.jsx` - Real-time monitoring and alerts
- `admin/DeviceManagement.jsx` - Device inventory and assignment
- `admin/UserManagement.jsx` - User profiles and activity
- `admin/Analytics.jsx` - Charts and statistics
- `admin/AdminSettings.jsx` - Configuration and logs

### Services Layer
- `firebaseConfig.js` - Firebase initialization
- `firebaseDeviceService.js` - Real-time IoT data management
- `deviceService.js` - Supabase device operations

### Utilities
- `formatters.js` - Data formatting functions
- `realtimeUtils.js` - Subscription management
- `useRealtimeData.js` - Custom React hooks

## Usage Guide

### 1. Real-time Monitoring
- View live sensor data from active devices
- Monitor device health and connectivity
- Receive alerts for anomalous readings
- Track active user sessions

### 2. Device Management
- View device inventory with real-time status
- Assign/unassign devices to users
- Monitor device health and battery levels
- Bulk operations for device management

### 3. User Management
- View user profiles and activity history
- Track device assignments per user
- Monitor user engagement and session data
- Export user reports

### 4. Analytics
- Usage statistics with interactive charts
- Device utilization trends
- User engagement metrics
- System performance analytics

### 5. Admin Settings
- Configure alert thresholds
- Manage system settings
- View admin activity logs
- Export system reports

## Troubleshooting

### Firebase Connection Issues
1. Verify Firebase configuration in `.env`
2. Check Firebase project permissions
3. Enable Realtime Database in Firebase Console
4. Verify database rules allow admin access

### Mock Data Mode
If Firebase is unavailable, the dashboard will:
1. Display mock device and user data
2. Simulate real-time updates
3. Show development warnings
4. Allow full UI testing

### Performance Optimization
- Real-time subscriptions are automatically managed
- Data aggregation reduces Firebase read operations
- Lazy loading for large datasets
- Efficient re-rendering with React hooks

## Security Considerations
- Admin-only access through `ProtectedRoute`
- Firebase security rules should restrict access
- Sensitive data is not exposed in client-side code
- Activity logging for audit trails

## Next Steps
1. Configure Firebase with actual project credentials
2. Set up Firebase security rules for admin access
3. Deploy IoT devices with proper Firebase integration
4. Configure alert thresholds for your use case
5. Customize analytics based on specific requirements

## Support
- Check browser console for detailed error messages
- Review Firebase and Supabase logs for backend issues
- Verify network connectivity for real-time features
- Contact development team for advanced configuration