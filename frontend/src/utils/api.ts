/**
 * CloudCare Frontend API Client
 * 
 * Provides HTTP client with JWT authentication, error handling,
 * and blockchain integration for the CloudCare healthcare system.
 */

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  timestamp: string;
  error?: {
    status: string;
    statusCode: number;
    code: string;
    message: string;
    timestamp: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  facilityId?: string;
  permissions?: string[];
  abhaNumber?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

// Login credentials interfaces
export interface StandardLoginData {
  email: string;
  password: string;
}

export interface DoctorLoginData {
  facilityId: string;
  password: string;
  captcha: string;
}

export interface ABHALoginData {
  method: 'mobile' | 'email' | 'abha-address' | 'abha-number';
  value: string;
  otp?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'patient' | 'doctor';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  description: string;
  diagnosis?: string[];
  symptoms?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    duration: string;
    frequency: string;
    instructions?: string;
  }>;
  labResults?: Array<{
    test: string;
    result: string;
    status?: string;
    reference?: string;
    date?: string;
  }>;
  imagingResults?: any[];
  notes?: string;
  visitDate: string;
  doctorId?: string;
  facilityName?: string;
  recordType: 'lab_report' | 'prescription' | 'imaging' | 'discharge_summary' | 'general' | 'consultation';
  confidentialityLevel: 'normal' | 'restricted' | 'confidential';
  followUpRequired?: boolean;
  followUpDate?: string | null;
  severity?: string;
  status?: string;
  files?: any[];
  blockchainHash?: string | null;
  shareableViaQr?: boolean;
  qrExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  isVerified?: boolean;
}

export interface BlockchainVerification {
  isValid: boolean;
  blockchainHash: string;
  currentHash: string;
  transactionHash?: string;
  verifiedAt: string;
  tamperDetected: boolean;
}

// QR System interfaces
export interface QRGenerateRequest {
  recordIds: string[];
  shareType: 'full' | 'summary' | 'specific' | 'emergency';
  expiresInHours: number;
  facilityId?: string;
}

export interface QRGenerateResponse {
  qrCode: string;
  qrData: object;
  shareToken: string;
  expiresAt: string;
  blockchainHash: string;
  accessUrl: string;
  recordCount: number;
}

export interface QRValidationResponse {
  valid: boolean;
  patientInfo?: {
    name: string;
    age: number;
    gender: string;
  };
  shareType: string;
  recordCount: number;
  expiresAt: string;
  facilitInfo?: {
    name: string;
    id: string;
  };
  blockchainHash: string;
  consentVerified: boolean;
}

export interface QRAccessRequest {
  accessorId: string;
  facilityId: string;
  purpose?: string;
}

export interface QRAccessResponse {
  records: Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    diagnosis: string[];
    medications: string[];
    blockchainVerified: boolean;
  }>;
  accessLogged: boolean;
  blockchainHash: string;
  patientConsent: string;
}

export interface QRHistoryResponse {
  history: Array<{
    token: string;
    record_ids: string[];
    facility_id: string;
    share_type: string;
    expires_at: string;
    access_count: number;
    created_at: string;
    last_accessed?: string;
    revoked: boolean;
    revoked_at?: string;
    blockchain_hash: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
  // Use relative path by default so LAN clients hit the same host the frontend is served from
  this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    this.loadTokens();
  }

  /**
   * Load JWT tokens from localStorage
   */
  private loadTokens(): void {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Save JWT tokens to localStorage
   */
  private saveTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  /**
   * Clear JWT tokens from localStorage
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Get default headers with JWT authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Handle API responses and errors
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      // Handle 401 Unauthorized - token refresh needed
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          throw new Error('TOKEN_REFRESHED');
        } else {
          this.clearTokens();
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data: ApiResponse<{ tokens: AuthTokens }> = await response.json();
        if (data.status === 'success' && data.data?.tokens) {
          this.saveTokens(data.data.tokens);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      // Retry once if token was refreshed
      if (error instanceof Error && error.message === 'TOKEN_REFRESHED' && retryCount === 0) {
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  // ============= AUTHENTICATION APIs =============

  /**
   * User registration
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'patient' | 'doctor';
    phoneNumber?: string;
    abhaNumber?: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * User login
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.status === 'success' && response.data?.tokens) {
      this.saveTokens(response.data.tokens);
    }

    return response;
  }

  /**
   * Doctor login with facility credentials
   */
  async doctorLogin(credentials: {
    facilityId: string;
    password: string;
    captcha: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/auth/doctor-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.status === 'success' && response.data?.tokens) {
      this.saveTokens(response.data.tokens);
    }

    return response;
  }

  /**
   * Send OTP for authentication
   */
  async sendOTP(data: {
    method: 'mobile' | 'email';
    value: string;
  }): Promise<ApiResponse<{ otpSent: boolean }>> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: {
    method: 'mobile' | 'email';
    value: string;
    otp: string;
  }): Promise<ApiResponse<{ verified: boolean }>> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * ABHA login for patients
   */
  async abhaLogin(credentials: {
    method: 'mobile' | 'abha-address' | 'abha-number' | 'email';
    value: string;
    otp?: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.request<{ user: User; tokens: AuthTokens }>('/auth/abha-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.status === 'success' && response.data?.tokens) {
      this.saveTokens(response.data.tokens);
    }

    return response;
  }

  /**
   * User logout
   */
  async logout(): Promise<ApiResponse> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
    return { status: 'success', timestamp: new Date().toISOString() };
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request('/auth/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============= MEDICAL RECORDS APIs (with Blockchain) =============

  /**
   * Create medical record with blockchain protection
   */
  async createMedicalRecord(data: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'blockchainHash'>): Promise<ApiResponse<MedicalRecord>> {
    return this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get medical record by ID with blockchain verification
   */
  async getMedicalRecord(id: string): Promise<ApiResponse<MedicalRecord>> {
    return this.request(`/medical-records/${id}`);
  }

  /**
   * Update medical record (creates new blockchain hash)
   */
  async updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<ApiResponse<MedicalRecord>> {
    return this.request(`/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all medical records for a patient
   */
  async getPatientMedicalRecords(patientId: string): Promise<ApiResponse<MedicalRecord[]>> {
    return this.request(`/medical-records/patient/${patientId}`);
  }

  /**
   * Get medical records for the current authenticated user (patients only)
   */
  async getMyMedicalRecords(): Promise<ApiResponse<MedicalRecord[]>> {
    return this.request('/medical-records/my-records');
  }

  /**
   * Verify medical record integrity on blockchain
   */
  async verifyMedicalRecord(id: string): Promise<ApiResponse<BlockchainVerification>> {
    return this.request(`/medical-records/${id}/verify`, { method: 'POST' });
  }

  // ============= DASHBOARD APIs =============

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<{
    // Frontend expected fields
    linkedFacilities: number;
    healthRecords: number;
    pendingConsents: number;
    connectedDevices: number;
    
    // Additional healthcare metrics
    totalRecords: number;
    recentVisits: number;
    pendingTests: number;
    upcomingAppointments: number;
    completedAppointments: number;
    healthScore: number;
    lastCheckup: string;
    nextAppointment: string;
    activeWearables: number;
    blockchainVerified: number;
    
    // Medical insights
    avgVitalSigns: {
      heartRate: number;
      bloodPressure: {
        systolic: number;
        diastolic: number;
      };
      bloodSugar: number;
      temperature: string;
    };
    
    // Weekly health trends
    weeklyHealthTrend: {
      steps: number[];
      sleep: number[];
      heartRate: number[];
    };
    
    // Prescription and medication tracking
    activePrescriptions: number;
    medicationAdherence: number;
    pendingRefills: number;
    
    // Emergency and alerts
    criticalAlerts: number;
    healthReminders: number;
    
    // Insurance and billing
    insuranceClaims: {
      pending: number;
      approved: number;
      denied: number;
    };
    estimatedCosts: number;
  }>> {
    return this.request('/dashboard/stats');
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(): Promise<ApiResponse<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      status: 'completed' | 'pending' | 'in-progress';
      category: 'medical' | 'data' | 'appointment' | 'system' | 'insurance' | 'medication';
    }>;
  }>> {
    return this.request('/dashboard/activity');
  }

  /**
   * Get health alerts
   */
  async getHealthAlerts(): Promise<ApiResponse<{
    alerts: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info' | 'medication' | 'appointment';
      message: string;
      timestamp: string;
      isRead: boolean;
      priority: 'high' | 'medium' | 'low';
    }>;
  }>> {
    return this.request('/dashboard/alerts');
  }

  /**
   * Get health trends data
   */
  async getHealthTrends(period: '7d' | '30d' | '90d' = '7d'): Promise<ApiResponse<{
    vitals: {
      heartRate: Array<{ date: string; value: number }>;
      bloodPressure: Array<{ date: string; systolic: number; diastolic: number }>;
      weight: Array<{ date: string; value: number }>;
    };
    activity: {
      steps: Array<{ date: string; value: number }>;
      sleep: Array<{ date: string; value: number }>;
      exercise: Array<{ date: string; minutes: number }>;
    };
  }>> {
    return this.request(`/dashboard/trends?period=${period}`);
  }

  // ============= MEDICATIONS APIs =============

  /**
   * Get user medications
   */
  async getMedications(): Promise<ApiResponse<{
    medications: Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      prescribedBy: string;
      startDate: string;
      endDate: string | null;
      instructions: string;
      remainingDoses: number;
      totalDoses: number;
      status: 'active' | 'inactive' | 'low_stock';
      adherence: number;
      sideEffects: string[];
      category: string;
    }>;
  }>> {
    return this.request('/medications');
  }

  /**
   * Get medication reminders
   */
  async getMedicationReminders(): Promise<ApiResponse<{
    reminders: Array<{
      id: string;
      medicationId: string;
      medicationName: string;
      dosage: string;
      scheduledTime: string;
      status: 'pending' | 'taken' | 'missed' | 'upcoming';
      type: 'daily_dose' | 'refill_needed';
    }>;
  }>> {
    return this.request('/medications/reminders');
  }

  /**
   * Record medication taken
   */
  async recordMedicationTaken(data: {
    medicationId: string;
    reminderId?: string;
    takenAt?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request('/medications/taken', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============= APPOINTMENTS APIs =============

  /**
   * Get user appointments
   */
  async getAppointments(): Promise<ApiResponse<{
    appointments: Array<{
      id: string;
      doctorName: string;
      specialty: string;
      facility: string;
      appointmentDate: string;
      appointmentTime: string;
      duration: number;
      type: string;
      status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
      reason: string;
      location: string;
      telehealth: boolean;
      preparation: string[];
      reminderSent: boolean;
    }>;
  }>> {
    return this.request('/appointments');
  }

  /**
   * Schedule new appointment
   */
  async scheduleAppointment(data: {
    doctorId: string;
    facility?: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    type?: string;
  }): Promise<ApiResponse> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<ApiResponse> {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // ============= VITAL SIGNS APIs =============

  /**
   * Get vital signs
   */
  async getVitalSigns(period: '7d' | '30d' | '90d' = '7d'): Promise<ApiResponse<{
    bloodPressure: Array<{
      date: string;
      systolic: number;
      diastolic: number;
      recordedAt: string;
      source: string;
    }>;
    heartRate: Array<{
      date: string;
      bpm: number;
      recordedAt: string;
      source: string;
      restingRate: boolean;
    }>;
    bloodSugar: Array<{
      date: string;
      level: number;
      unit: string;
      mealRelation: string;
      recordedAt: string;
      source: string;
    }>;
    weight: Array<{
      date: string;
      weight: number;
      unit: string;
      recordedAt: string;
      source: string;
    }>;
    temperature: Array<{
      date: string;
      temperature: string;
      unit: string;
      recordedAt: string;
      source: string;
    }>;
  }>> {
    return this.request(`/vitals?period=${period}`);
  }

  /**
   * Add new vital sign reading
   */
  async recordVitalSign(data: {
    type: 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'weight' | 'temperature' | 'oxygen_saturation';
    value: any;
    unit?: string;
    notes?: string;
    source?: string;
  }): Promise<ApiResponse> {
    return this.request('/vitals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get vital signs summary
   */
  async getVitalSignsSummary(): Promise<ApiResponse<{
    latest: {
      bloodPressure: {
        systolic: number;
        diastolic: number;
        recordedAt: string;
        status: string;
      };
      heartRate: {
        bpm: number;
        recordedAt: string;
        status: string;
      };
      bloodSugar: {
        level: number;
        unit: string;
        recordedAt: string;
        status: string;
      };
      weight: {
        weight: number;
        unit: string;
        recordedAt: string;
        trend: string;
      };
    };
    ranges: any;
    alerts: Array<{
      type: string;
      message: string;
      severity: string;
      timestamp: string;
    }>;
  }>> {
    return this.request('/vitals/summary');
  }

  // ============= HEALTH CHECK APIs =============

  /**
   * Check API health
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  /**
   * Check detailed system health (including blockchain)
   */
  async detailedHealthCheck(): Promise<ApiResponse<{
    database: { status: string; responseTime: number };
    blockchain: { status: string; network: string; balance?: string };
    services: { [key: string]: string };
  }>> {
    return this.request('/health/detailed');
  }

  // ============= QR SHARING SYSTEM APIs (with Blockchain Consent) =============

  /**
   * Generate QR code for medical record sharing with blockchain consent
   */
  async generateQRCode(data: QRGenerateRequest): Promise<ApiResponse<QRGenerateResponse>> {
    return this.request('/qr/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Validate QR token and get sharing metadata
   */
  async validateQRToken(token: string): Promise<ApiResponse<QRValidationResponse>> {
    return this.request(`/qr/validate`, {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Access medical records via QR token
   */
  async accessViaQR(token: string, accessData: QRAccessRequest): Promise<ApiResponse<QRAccessResponse>> {
    const queryParams = new URLSearchParams();
    if (accessData.facilityId) queryParams.append('facilityId', accessData.facilityId);
    if (accessData.accessorId) queryParams.append('accessorId', accessData.accessorId);
    if (accessData.purpose) queryParams.append('purpose', accessData.purpose);
    
    const queryString = queryParams.toString();
    const url = `/qr/access/${token}${queryString ? `?${queryString}` : ''}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * Revoke QR token and update blockchain consent
   */
  async revokeQRToken(token: string): Promise<ApiResponse<{
    revoked: boolean;
    revokedAt: string;
    blockchainHash: string;
    reason: string;
  }>> {
    return this.request(`/qr/revoke/${token}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get QR sharing history with blockchain audit trail
   */
  async getQRHistory(): Promise<ApiResponse<QRHistoryResponse>> {
    return this.request('/qr/history');
  }

  // ============= UTILITY METHODS =============

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // =============================================================================
  // CONSENT MANAGEMENT METHODS
  // =============================================================================

  /**
   * Get all consent requests for the authenticated patient
   */
  async getConsents(params: {
    page?: number;
    limit?: number;
    status?: string;
    consentType?: string;
  } = {}): Promise<ApiResponse<{
    consents: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.consentType) searchParams.append('consentType', params.consentType);
    
    const query = searchParams.toString();
    const url = `/consents${query ? `?${query}` : ''}`;
    
    return this.request<any>(url, { method: 'GET' });
  }

  /**
   * Get a specific consent request by ID
   */
  async getConsentById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/consents/${id}`, { method: 'GET' });
  }

  /**
   * Update consent status (approve/deny/revoke)
   */
  async updateConsentStatus(id: string, update: {
    action: 'approved' | 'denied' | 'revoked';
    reason?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>(`/consents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(update)
    });
  }

  /**
   * Create a new consent request (for testing)
   */
  async createConsent(consentData: {
    facilityName: string;
    requestorName: string;
    requestorEmail: string;
    consentType: 'data_access' | 'subscription' | 'emergency_access' | 'research';
    purpose: string;
    permissionLevel: 'read' | 'write' | 'full_access';
    dataTypes: string[];
    validFrom?: string;
    validTo?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/consents', {
      method: 'POST',
      body: JSON.stringify(consentData)
    });
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
