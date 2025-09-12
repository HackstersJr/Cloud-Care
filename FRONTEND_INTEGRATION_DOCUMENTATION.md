# CloudCare Frontend Components Documentation

## 📱 **Overview**
This document provides comprehensive documentation for all frontend components in the CloudCare healthcare application, designed for integration with the Node.js/Express backend.

---

## 🏗️ **Architecture**

### **Tech Stack**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router DOM 7.8.2
- **Icons**: Lucide React 0.344.0
- **State Management**: React Context API

### **Project Structure**
```
src/
├── components/           # Main UI components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout and navigation
│   └── [feature].tsx   # Feature-specific components
├── contexts/            # React context providers
└── App.tsx             # Main application router
```

---

## 🔐 **Authentication Components**

### **LoginPage.tsx**
**Purpose**: ABHA (Ayushman Bharat Health Account) user authentication
**Location**: `/components/auth/LoginPage.tsx`
**Route**: `/login`

**Features**:
- Multi-method login support:
  - Mobile Number
  - ABHA Address  
  - ABHA Number
  - Email
- OTP verification flow
- Responsive mobile-first design

**Backend Integration Points**:
```typescript
// Current mock implementation needs replacement
const handleLogin = async () => {
  if (formData.otp) {
    await login({ method: selectedMethod, ...formData });
  }
};
```

**Required API Endpoints**:
- `POST /api/v1/auth/send-otp` - Send OTP to user
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/abha-login` - ABHA-specific authentication

**State Management**:
- `selectedMethod`: Login method (mobile/abha-address/abha-number/email)
- `formData`: { value: string, otp: string }
- `showOTP`: Boolean for OTP input visibility

---

### **DoctorLoginPage.tsx**
**Purpose**: Healthcare provider authentication
**Location**: `/components/auth/DoctorLoginPage.tsx`
**Route**: Accessible via landing page

**Features**:
- Facility ID + password authentication
- CAPTCHA verification
- Switch to ABHA login option
- Professional healthcare interface

**Backend Integration Points**:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  // Needs API integration for doctor authentication
  if (formData.facilityId && formData.password && formData.captcha) {
    onLogin();
  }
};
```

**Required API Endpoints**:
- `POST /api/v1/auth/doctor-login` - Doctor authentication
- `GET /api/v1/auth/captcha` - Generate CAPTCHA
- `POST /api/v1/auth/verify-captcha` - Verify CAPTCHA

**Form Data**:
- `facilityId`: Doctor's facility identifier
- `password`: Authentication password
- `captcha`: CAPTCHA verification

---

## 🏥 **Dashboard Components**

### **Dashboard.tsx** (Patient Dashboard)
**Purpose**: Patient main dashboard with health overview
**Location**: `/components/Dashboard.tsx`
**Route**: `/dashboard`

**Features**:
- Health statistics cards (Linked Facilities, Health Records, Pending Consents, Connected Devices)
- Recent activity timeline
- Quick action buttons
- Welcome section with sync status

**Data Requirements**:
```typescript
interface DashboardData {
  stats: {
    linkedFacilities: number;
    healthRecords: number;
    pendingConsents: number;
    connectedDevices: number;
  };
  recentActivity: Array<{
    title: string;
    time: string;
    type: 'share' | 'consent' | 'device' | 'upload';
  }>;
}
```

**Backend API Endpoints**:
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/dashboard/activity` - Recent activity feed

---

### **DoctorDashboard.tsx**
**Purpose**: Healthcare provider dashboard with analytics
**Location**: `/components/DoctorDashboard.tsx`
**Route**: Accessible after doctor login

**Features**:
- Medical analytics and charts
- Patient management metrics
- Disease analysis charts
- Appointment management
- Health insights tabs

**Tab System**:
- Health Insights
- Patient Records
- Disease Analysis
- Medical Reports
- Appointments

**Metrics Cards**:
- Total Patients
- Active Cases
- Critical Patients
- Medical Reports

**Backend API Endpoints**:
- `GET /api/v1/doctor/dashboard/metrics` - Doctor dashboard metrics
- `GET /api/v1/doctor/patients` - Patient data
- `GET /api/v1/doctor/analytics` - Medical analytics

---

## 📋 **Medical Records Management**

### **MyRecords.tsx**
**Purpose**: Patient health records management
**Location**: `/components/MyRecords.tsx`
**Route**: `/records`

**Features**:
- Categorized record filtering (Lab Reports, Prescriptions, Imaging, Discharge Summary)
- Record download functionality
- File size and date information
- Healthcare facility attribution

**Record Structure**:
```typescript
interface HealthRecord {
  id: number;
  title: string;
  facility: string;
  date: string;
  category: 'Lab Reports' | 'Prescriptions' | 'Imaging' | 'Discharge Summary';
  size: string;
  fileUrl?: string;
}
```

**Backend API Endpoints**:
- `GET /api/v1/medical-records` - Fetch patient records
- `GET /api/v1/medical-records/:id/download` - Download specific record
- `POST /api/v1/medical-records/upload` - Upload new record

---

### **LinkedFacilities.tsx**
**Purpose**: Healthcare facility management
**Location**: `/components/LinkedFacilities.tsx`
**Route**: `/facilities`

**Features**:
- Connected healthcare facilities display
- Patient ID management per facility
- QR code scanning for record pulling
- Facility linking functionality

**Facility Structure**:
```typescript
interface LinkedFacility {
  name: string;
  patientId: string;
  type: string;
  icon: LucideIcon;
  color: string;
}
```

**Backend API Endpoints**:
- `GET /api/v1/facilities/linked` - Get linked facilities
- `POST /api/v1/facilities/link` - Link new facility
- `POST /api/v1/facilities/pull-records` - Pull records via QR

---

## 🔗 **Integration & Sharing**

### **ScanShare.tsx**
**Purpose**: QR code sharing and ABHA details sharing
**Location**: `/components/ScanShare.tsx`
**Route**: `/scan`

**Features**:
- QR code scanning camera interface
- QR code upload from gallery
- ABHA details sharing with healthcare providers
- Token generation for verification
- Share history tracking

**Share History Structure**:
```typescript
interface ShareHistory {
  facility: string;
  date: string;
  token: string;
}
```

**Backend API Endpoints**:
- `POST /api/v1/qr/scan` - Process scanned QR code
- `POST /api/v1/qr/share` - Share ABHA details
- `GET /api/v1/qr/history` - Get sharing history
- `POST /api/v1/qr/generate` - Generate patient QR code

---

### **Consents.tsx**
**Purpose**: Healthcare data consent management
**Location**: `/components/Consents.tsx`
**Route**: `/consents`

**Features**:
- Consent request management (Pending, Approved, Denied, Expired)
- Dual view: Requests and Approved consents
- Healthcare facility consent tracking
- Purpose and duration display

**Consent Structure**:
```typescript
interface ConsentRequest {
  id: number;
  facility: string;
  type: 'Subscription Request' | 'Data Access Request';
  purpose: string;
  duration: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Expired';
}
```

**Backend API Endpoints**:
- `GET /api/v1/consents` - Get consent requests
- `POST /api/v1/consents/:id/approve` - Approve consent
- `POST /api/v1/consents/:id/deny` - Deny consent
- `DELETE /api/v1/consents/:id` - Revoke consent

---

## 🔌 **Device Integration**

### **Wearables.tsx**
**Purpose**: Wearable device and health app integration
**Location**: `/components/Wearables.tsx`
**Route**: `/wearables`

**Features**:
- Connected device management
- Health metrics overview (Steps, Heart Rate, Sleep, Calories)
- Device battery and sync status
- Multi-platform support (Fitbit, Apple Health, Google Fit, etc.)

**Device Structure**:
```typescript
interface ConnectedDevice {
  id: number;
  name: string;
  type: string;
  battery: number;
  lastSync: string;
  status: 'Connected' | 'Disconnected';
  icon: LucideIcon;
  color: string;
}
```

**Health Metrics**:
```typescript
interface HealthMetrics {
  steps: { value: string; change: string };
  heartRate: { value: string; status: string };
  sleep: { value: string; change: string };
  calories: { value: string; change: string };
}
```

**Backend API Endpoints**:
- `GET /api/v1/wearables/devices` - Get connected devices
- `POST /api/v1/wearables/connect` - Connect new device
- `GET /api/v1/wearables/metrics` - Get health metrics
- `POST /api/v1/wearables/sync` - Sync device data

---

## ⚙️ **Settings & Configuration**

### **Settings.tsx**
**Purpose**: Application settings and user account management
**Location**: `/components/Settings.tsx`
**Route**: `/settings`

**Features**:
- Account settings menu
- Language preferences
- Privacy policy and terms access
- Health locker management
- Token history
- Logout functionality

**Menu Items**:
- Health locker
- Token history
- Language change
- Share app link
- FAQ
- Privacy policy
- Terms of use
- About us
- Contact us

**Backend API Endpoints**:
- `GET /api/v1/settings/profile` - Get user profile
- `PUT /api/v1/settings/profile` - Update profile
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/settings/preferences` - Get user preferences

---

## 🎨 **Layout Components**

### **Layout.tsx**
**Purpose**: Main application layout wrapper
**Location**: `/components/layout/Layout.tsx`

**Features**:
- Responsive header with navigation
- Side menu integration
- Bottom navigation
- Notification badges
- QR code quick access

### **BottomNavigation.tsx**
**Purpose**: Mobile bottom navigation bar
**Location**: `/components/layout/BottomNavigation.tsx`

**Navigation Items**:
- My Records (`/records`)
- Linked Facilities (`/facilities`)
- Scan & Share (`/scan`)
- Consents (`/consents`)

### **SideMenu.tsx**
**Purpose**: Collapsible side navigation menu
**Location**: `/components/layout/SideMenu.tsx`

---

## 📊 **Analytics Components**

### **MetricsCard.tsx**
**Purpose**: Reusable metrics display card
**Features**: Color-coded metrics with change indicators

### **DiseaseChart.tsx**
**Purpose**: Disease category analytics for doctors
**Features**: Horizontal bar chart with percentages

### **PatientChart.tsx, StateWiseChart.tsx, TrendChart.tsx**
**Purpose**: Various analytical charts for healthcare insights

---

## 🔗 **Backend Integration Requirements**

### **Authentication Context Update**
Current mock implementation needs replacement:

```typescript
// Replace in AuthContext.tsx
const login = async (credentials: any) => {
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      setIsAuthenticated(true);
      setUser(data.data.user);
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### **API Configuration**
Create API utility file:

```typescript
// src/utils/api.ts
const API_BASE_URL = 'http://localhost:3000/api/v1';

export const apiClient = {
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`),
  post: (endpoint: string, data: any) => 
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  // Add other HTTP methods as needed
};
```

### **Required Environment Variables**
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ABHA_BASE_URL=https://healthidsbx.abdm.gov.in
```

---

## 🚀 **Next Steps for Integration**

1. **Replace Mock Authentication**: Update AuthContext with real API calls
2. **Add JWT Token Management**: Implement token refresh and storage
3. **Connect Data Fetching**: Replace static data with API calls
4. **Add Error Handling**: Implement proper error boundaries and user feedback
5. **Add Loading States**: Show loading indicators during API calls
6. **Implement Form Validation**: Add robust client-side validation
7. **Add Offline Support**: Implement service workers for PWA functionality

---

## 📋 **API Endpoint Summary**

### **Authentication**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`

### **Dashboard**
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/activity`

### **Medical Records**
- `GET /api/v1/medical-records`
- `POST /api/v1/medical-records/upload`
- `GET /api/v1/medical-records/:id/download`

### **Facilities**
- `GET /api/v1/facilities/linked`
- `POST /api/v1/facilities/link`

### **QR & Sharing**
- `POST /api/v1/qr/scan`
- `POST /api/v1/qr/share`
- `GET /api/v1/qr/history`

### **Consents**
- `GET /api/v1/consents`
- `POST /api/v1/consents/:id/approve`

### **Wearables**
- `GET /api/v1/wearables/devices`
- `POST /api/v1/wearables/connect`
- `GET /api/v1/wearables/metrics`

---

This documentation provides a complete reference for integrating the React frontend with the Node.js backend. Each component is designed to work seamlessly with the existing authentication system and healthcare data models.
