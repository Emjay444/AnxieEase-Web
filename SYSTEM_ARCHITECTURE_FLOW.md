# AnxieEase System Architecture & Data Flow

## 🏗️ Complete System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Flutter App    │    │   Web Dashboard │    │  IoT Devices    │
│   (Patients)    │    │ (Psychologists/ │    │  (Wearables)    │
│                 │    │     Admins)     │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────┬───────────┴──────────────────────┘
                     │
          ┌─────────────────────────────────────────────┐
          │            BACKEND SERVICES                 │
          │  ┌─────────────────┐  ┌─────────────────┐   │
          │  │    Supabase     │  │    Firebase     │   │
          │  │   (Database)    │  │  (Real-time)    │   │
          │  └─────────────────┘  └─────────────────┘   │
          └─────────────────────────────────────────────┘
```

## 📱 Client Applications

### 1. Flutter Mobile App (Patient-Facing)

**Purpose**: Primary interface for patients to log mood data and interact with the system

**Key Features**:

- Patient authentication via Supabase Auth
- Mood & anxiety logging
- Symptom tracking
- Appointment requests
- Real-time device connection status

**Data Flow**:

```
Patient Login → Supabase Auth → Patient Dashboard
    ↓
Mood Logging → Supabase (mood_logs/wellness_logs tables)
    ↓
Device Data → Firebase Realtime Database → Web Dashboard
```

### 2. Web Dashboard (Professional Interface)

**Purpose**: Interface for psychologists and administrators

**Roles**:

- **Psychologists**: Patient management, notes, appointments
- **Admins**: User management, device assignment, system analytics

## 🗄️ Database Architecture

### Supabase (Primary Database)

#### Core Tables:

```sql
auth.users                    -- Authentication (Supabase managed)
├── user_metadata.role        -- 'patient', 'psychologist', 'admin'

user_profiles                 -- Extended user information
├── id (UUID)
├── first_name, last_name, email
├── role ('patient', 'psychologist', 'admin')
├── assigned_psychologist_id
└── created_at, updated_at

psychologists                 -- Licensed professionals
├── id (TEXT)
├── user_id (UUID → auth.users)
├── name, email, contact
├── is_active
└── specialization

patients                      -- Patient records (legacy, transitioning to user_profiles)
├── id (TEXT)
├── user_id (UUID → auth.users)
├── assigned_psychologist_id
└── is_active

mood_logs / wellness_logs     -- Patient mental health data
├── id (UUID)
├── patient_id / user_id
├── log_date, mood, stress_level
├── symptoms (TEXT[])
└── notes

wearable_devices             -- IoT device inventory
├── device_id (TEXT)
├── user_id (UUID → user_profiles)
├── status ('available', 'assigned', 'active')
├── battery_level
└── last_seen_at

appointments                 -- Scheduling system
├── user_id (UUID → patients)
├── psychologist_id (TEXT → psychologists)
├── appointment_date
├── status ('pending', 'approved', 'completed')
└── notes

activity_logs               -- Admin audit trail
├── user_id (UUID → auth.users)
├── action, details
└── timestamp
```

### Firebase Realtime Database (IoT & Live Data)

#### Structure:

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
          "accelerometer": { "x": 0.1, "y": 0.2, "z": 9.8 },
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

## 🔐 Authentication & Authorization Flow

### 1. User Registration & Setup

```
Admin Creates User Account
    ↓
Supabase Auth.createUser()
    ↓
User receives invitation email
    ↓
User completes setup (PsychologistSetupPage/AdminSetupPage)
    ↓
Profile activated in respective table
```

### 2. Login Process

```
User Login Attempt
    ↓
Supabase Auth.signInWithPassword()
    ↓
Role verification (authService.getUserRole())
    ↓
Check against psychologists/admin_profiles tables
    ↓
Route to appropriate dashboard
```

### 3. Role-Based Access Control

- **Patients**: Cannot login to web dashboard (blocked in authService)
- **Psychologists**: Access assigned patients only
- **Admins**: Full system access

## 🔗 API Endpoints & Services

### Supabase REST API

Base URL: `https://gqsustjxzjzfntcsnvpk.supabase.co/rest/v1/`

#### Patient Management:

```javascript
// Get patients assigned to psychologist
GET /user_profiles?role=eq.patient&assigned_psychologist_id=eq.{psych_id}

// Get patient mood logs
GET /mood_logs?patient_id=eq.{patient_id}
GET /wellness_logs?user_id=eq.{patient_id}

// Add patient note
POST /patient_notes
{
  "patient_id": "string",
  "psychologist_id": "string",
  "note_content": "string"
}
```

#### Device Management:

```javascript
// Get device status
GET /wearable_devices?device_id=eq.AnxieEase001

// Assign device to user
PATCH /wearable_devices?device_id=eq.{device_id}
{
  "user_id": "uuid",
  "status": "assigned",
  "linked_at": "timestamp"
}
```

#### Appointments:

```javascript
// Create appointment request
POST /appointments
{
  "user_id": "uuid",
  "psychologist_id": "string",
  "appointment_date": "timestamp",
  "status": "pending"
}

// Update appointment status
PATCH /appointments?id=eq.{appointment_id}
{
  "status": "approved",
  "psychologist_response": "string"
}
```

### Firebase Realtime Database API

Base URL: `https://anxieease-sensors-default-rtdb.asia-southeast1.firebasedatabase.app/`

#### Real-time Data:

```javascript
// Subscribe to device sensor data
firebase
  .database()
  .ref("device_sessions/device_001/current_session/sensor_data")
  .on("value", (snapshot) => {
    // Handle real-time sensor updates
  });

// Update device status
firebase.database().ref("device_sessions/device_001/device_info").update({
  battery_level: 80,
  last_seen: new Date().toISOString(),
  status: "online",
});
```

## 📊 Data Flow Diagrams

### 1. Patient Mood Logging Flow

```
Flutter App                 Supabase Database          Web Dashboard
    │                           │                          │
    │─── Patient logs mood ────→│                          │
    │                           │                          │
    │                           │← Store in mood_logs ────│
    │                           │                          │
    │                           │── Notify psychologist ──→│
    │                           │                          │
    │← Confirmation ────────────│                          │
```

### 2. IoT Device Data Flow

```
Wearable Device           Firebase Realtime           Web Dashboard
     │                         │                          │
     │─── Sensor data ────────→│                          │
     │                         │                          │
     │                         │─── Real-time stream ────→│
     │                         │                          │
     │                         │                          │← Admin monitors
     │                         │                          │
     │← Device commands ───────│←── Control signals ──────│
```

### 3. Appointment Scheduling Flow

```
Flutter App              Supabase Database           Web Dashboard
     │                         │                          │
     │─── Request appt ───────→│                          │
     │                         │                          │
     │                         │── Store request ────────→│
     │                         │                          │
     │                         │                          │← Psychologist views
     │                         │                          │
     │                         │←── Update status ────────│
     │                         │                          │
     │← Notification ──────────│                          │
```

### 4. Device Assignment Flow

```
Admin Dashboard          Supabase Database           Firebase Realtime
      │                        │                           │
      │─── Assign device ─────→│                           │
      │                        │                           │
      │                        │← Update wearable_devices ─│
      │                        │                           │
      │                        │── Sync assignment ───────→│
      │                        │                           │
      │← Confirmation ─────────│                           │
```

## 🔄 System Integration Points

### 1. Authentication Sync

- Supabase Auth manages all user sessions
- Role verification happens on every request
- Patient accounts blocked from web access

### 2. Data Synchronization

- Patient mood data: Flutter → Supabase → Web Dashboard
- Device data: IoT → Firebase → Web Dashboard
- Assignments: Web Dashboard → Supabase ↔ Firebase

### 3. Real-time Features

- Device status monitoring (Firebase WebSockets)
- Live sensor data streaming
- Instant notification of critical readings

## 🚀 Key Service Components

### Frontend Services (`src/services/`)

```
authService.js          - User authentication & session management
patientService.js       - Patient data CRUD operations
deviceService.js        - Wearable device management
firebaseDeviceService.js - Real-time IoT data handling
appointmentService.js   - Scheduling & appointment management
adminService.js         - Admin analytics & user management
anxietyService.js       - Mental health data analysis
```

### Database Clients

```
supabaseClient.js       - Supabase connection & query handling
firebaseConfig.js       - Firebase Realtime Database setup
```

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://gqsustjxzjzfntcsnvpk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Development Options
VITE_DEBUG_SUPABASE=true
VITE_FIREBASE_USE_EMULATOR=true
```

## 🏃‍♂️ Application Routes

### Public Routes

```
/login                  - LoginPageNew component
/forgot-password        - Password recovery
/reset-password         - Password reset with token
/psychologist-setup     - Psychologist account setup
/admin-setup           - Admin account setup
```

### Protected Routes (Authentication Required)

```
/dashboard             - Main dashboard (role-based)
/patient/:patientId    - Individual patient profile
/admin                 - Admin panel (admin only)
/admin-iot            - IoT device dashboard (admin only)
```

## 🔒 Security Features

### Row Level Security (RLS)

- Patients can only access their own data
- Psychologists can only see assigned patients
- Admins have full access with audit logging

### Authentication Security

- Progressive lockout on failed login attempts
- Session timeout management
- Role-based route protection

### Data Validation

- Input sanitization on all forms
- Real-time validation feedback
- Error handling with user-friendly messages

## 📈 Analytics & Monitoring

### Admin Dashboard Metrics

- Total users (patients, psychologists)
- Device utilization rates
- Monthly registration trends
- Appointment completion rates

### Real-time Monitoring

- Device battery levels
- Connection status
- Sensor data anomalies
- User activity tracking

## 🔄 Development & Testing

### Mock Data Support

- Development mode with simulated data
- Firebase emulator support
- Graceful fallback when services unavailable

### Database Migration Scripts

- Schema setup scripts in repository root
- Device management setup automation
- Data migration helpers

This comprehensive architecture enables a scalable, secure, and real-time anxiety monitoring system that connects patients, healthcare providers, and IoT devices seamlessly.
