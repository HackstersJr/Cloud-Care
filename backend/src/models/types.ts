// Base interfaces for all healthcare entities

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// User roles in the healthcare system
export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin';

// Gender options
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// Blood types
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

// User base interface
export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  profileCompleted: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
}

// Patient-specific information
export interface Patient extends BaseEntity {
  userId: string; // Reference to User table
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phoneNumber: string;
  emergencyContact: EmergencyContact;
  address: Address;
  abhaId?: string; // Ayushman Bharat Health Account ID
  bloodType?: BloodType;
  allergies: string[];
  chronicConditions: string[];
  insuranceInfo?: InsuranceInfo;
  familyHistory?: FamilyHistory[];
  preferredLanguage: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  occupation?: string;
  nextOfKin?: NextOfKin;
}

// Doctor information
export interface Doctor extends BaseEntity {
  userId: string; // Reference to User table
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialization: string[];
  qualification: string[];
  experience: number; // years
  phoneNumber: string;
  hospitalAffiliation?: string[];
  consultationFee?: number;
  availableHours?: AvailabilitySlot[];
  rating?: number;
  reviewCount?: number;
  isVerified: boolean;
  abhaId?: string;
}

// Nurse information
export interface Nurse extends BaseEntity {
  userId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  qualification: string[];
  specialization?: string[];
  experience: number;
  phoneNumber: string;
  hospitalAffiliation?: string[];
  shift?: 'day' | 'night' | 'rotating';
}

// Medical records
export interface MedicalRecord extends BaseEntity {
  patientId: string;
  doctorId?: string | undefined;
  recordType: 'consultation' | 'prescription' | 'lab_report' | 'imaging' | 'surgery' | 'vaccination' | 'allergy' | 'other';
  title: string;
  description: string;
  diagnosis?: string[] | undefined;
  symptoms?: string[] | undefined;
  medications?: Medication[] | undefined;
  labResults?: LabResult[] | undefined;
  imagingResults?: ImagingResult[] | undefined;
  notes: string;
  visitDate: Date;
  followUpRequired: boolean;
  followUpDate?: Date | undefined;
  severity?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  status: 'active' | 'resolved' | 'chronic' | 'monitoring';
  files?: MedicalFile[] | undefined;
  confidentialityLevel: 'public' | 'restricted' | 'confidential';
  blockchainHash?: string | undefined; // For blockchain storage
  shareableViaQR: boolean;
  qrExpiresAt?: Date | undefined;
}

// Supporting types

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validUntil: Date;
  coverageType: string;
  copayAmount?: number;
}

export interface FamilyHistory {
  relationship: string; // father, mother, sibling, etc.
  condition: string;
  ageOfOnset?: number;
  notes?: string;
}

export interface NextOfKin {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: Address;
}

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribedDate: Date;
  prescribedBy: string; // Doctor ID
  isActive: boolean;
  sideEffects?: string[];
}

export interface LabResult {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: 'normal' | 'abnormal' | 'critical';
  testedDate: Date;
  labName?: string;
  notes?: string;
}

export interface ImagingResult {
  imagingType: 'x-ray' | 'mri' | 'ct-scan' | 'ultrasound' | 'mammogram' | 'other';
  bodyPart: string;
  findings: string;
  impression: string;
  imagedDate: Date;
  radiologistName?: string;
  images?: string[]; // File URLs
}

export interface MedicalFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: string; // User ID
  fileUrl: string;
  isEncrypted: boolean;
  checksum: string;
}

// Appointment system
export interface Appointment extends BaseEntity {
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  duration: number; // minutes
  type: 'consultation' | 'follow-up' | 'emergency' | 'surgery' | 'checkup';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  reminderSent: boolean;
  telehealth: boolean;
  meetingLink?: string;
  fee?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed';
}

// Family linking system
export interface FamilyLink extends BaseEntity {
  primaryPatientId: string; // The patient who initiated the link
  linkedPatientId: string; // The patient being linked
  relationship: string; // spouse, child, parent, sibling, etc.
  accessLevel: 'full' | 'limited' | 'emergency-only';
  approvedBy: string; // User ID who approved the link
  expiresAt?: Date;
  permissions: string[]; // specific permissions granted
}

// Audit trail for HIPAA compliance
export interface AuditLog extends BaseEntity {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

// QR Code sharing for medical records
export interface QRCodeShare extends BaseEntity {
  recordId: string;
  patientId: string;
  createdBy: string; // User ID
  token: string;
  expiresAt: Date;
  accessCount: number;
  maxAccesses?: number;
  permissions: string[];
  isActive: boolean;
  accessLog?: QRAccessLog[];
}

export interface QRAccessLog {
  id: string;
  qrShareId: string;
  accessedAt: Date;
  ipAddress: string;
  userAgent?: string;
  location?: string;
}

// Blockchain integration
export interface BlockchainRecord extends BaseEntity {
  recordId: string;
  patientId: string;
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  dataHash: string;
  gasUsed: number;
  status: 'pending' | 'confirmed' | 'failed';
  networkId: string;
}

// Notification system
export interface Notification extends BaseEntity {
  userId: string;
  type: 'appointment' | 'medication' | 'lab-result' | 'emergency' | 'system' | 'family-request';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// System configuration
export interface SystemConfig extends BaseEntity {
  key: string;
  value: string;
  description?: string;
  category: string;
  isPublic: boolean;
  lastModifiedBy: string;
}
