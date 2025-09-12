-- CloudCare Healthcare Database Initialization
-- This script creates all necessary tables for the healthcare management system
-- HIPAA compliant with audit logging and encryption capabilities

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (base authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    profile_completed BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    phone_number VARCHAR(20) NOT NULL,
    emergency_contact JSONB,
    address JSONB NOT NULL,
    abha_id VARCHAR(50) UNIQUE,
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    allergies TEXT[],
    chronic_conditions TEXT[],
    insurance_info JSONB,
    family_history JSONB[],
    preferred_language VARCHAR(10) DEFAULT 'en',
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    occupation VARCHAR(100),
    next_of_kin JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization TEXT[] NOT NULL,
    qualification TEXT[] NOT NULL,
    experience INTEGER DEFAULT 0,
    phone_number VARCHAR(20) NOT NULL,
    hospital_affiliation TEXT[],
    consultation_fee DECIMAL(10,2),
    available_hours JSONB[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    abha_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Nurses table
CREATE TABLE IF NOT EXISTS nurses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    qualification TEXT[] NOT NULL,
    specialization TEXT[],
    experience INTEGER DEFAULT 0,
    phone_number VARCHAR(20) NOT NULL,
    hospital_affiliation TEXT[],
    shift VARCHAR(20) CHECK (shift IN ('day', 'night', 'rotating')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Medical records table (core PHI storage)
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id),
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('consultation', 'prescription', 'lab_report', 'imaging', 'surgery', 'vaccination', 'allergy', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    diagnosis TEXT[],
    symptoms TEXT[],
    medications JSONB[],
    lab_results JSONB[],
    imaging_results JSONB[],
    notes TEXT,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic', 'monitoring')),
    files JSONB[],
    confidentiality_level VARCHAR(20) DEFAULT 'restricted' CHECK (confidentiality_level IN ('public', 'restricted', 'confidential')),
    blockchain_hash VARCHAR(255),
    shareable_via_qr BOOLEAN DEFAULT FALSE,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 30, -- minutes
    type VARCHAR(50) NOT NULL CHECK (type IN ('consultation', 'follow-up', 'emergency', 'surgery', 'checkup')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
    reason TEXT NOT NULL,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    telehealth BOOLEAN DEFAULT FALSE,
    meeting_link VARCHAR(500),
    fee DECIMAL(10,2),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Family links table (for family account linking)
CREATE TABLE IF NOT EXISTS family_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    linked_patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    access_level VARCHAR(20) DEFAULT 'limited' CHECK (access_level IN ('full', 'limited', 'emergency-only')),
    approved_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(primary_patient_id, linked_patient_id)
);

-- QR code sharing table
CREATE TABLE IF NOT EXISTS qr_code_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0,
    max_accesses INTEGER,
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- QR access log table
CREATE TABLE IF NOT EXISTS qr_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_share_id UUID REFERENCES qr_code_shares(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET NOT NULL,
    user_agent TEXT,
    location TEXT
);

-- Blockchain records table
CREATE TABLE IF NOT EXISTS blockchain_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    block_number BIGINT,
    contract_address VARCHAR(255) NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    gas_used INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    network_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Audit logs table (HIPAA compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    ip_address INET NOT NULL,
    user_agent TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment', 'medication', 'lab-result', 'emergency', 'system', 'family-request')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_required BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON patients(abha_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_shares_token ON qr_code_shares(token);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON nurses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_links_updated_at BEFORE UPDATE ON family_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_code_shares_updated_at BEFORE UPDATE ON qr_code_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blockchain_records_updated_at BEFORE UPDATE ON blockchain_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
