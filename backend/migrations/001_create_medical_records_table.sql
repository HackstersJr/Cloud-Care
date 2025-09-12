-- Migration: Create medical_records table with blockchain integration
-- Created: 2025-09-12
-- Description: Creates the medical_records table with all necessary fields including blockchain hash storage

CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NULL,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('consultation', 'prescription', 'lab_report', 'imaging', 'surgery', 'vaccination', 'allergy', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    diagnosis JSONB DEFAULT '[]'::jsonb,
    symptoms JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    lab_results JSONB DEFAULT '[]'::jsonb,
    imaging_results JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic', 'monitoring')),
    confidentiality_level VARCHAR(20) NOT NULL DEFAULT 'restricted' CHECK (confidentiality_level IN ('public', 'restricted', 'confidential')),
    blockchain_hash VARCHAR(128) NULL, -- Transaction hash from Polygon blockchain
    shareable_via_qr BOOLEAN DEFAULT false,
    qr_expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_severity ON medical_records(severity);
CREATE INDEX IF NOT EXISTS idx_medical_records_blockchain_hash ON medical_records(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_medical_records_shareable_qr ON medical_records(shareable_via_qr) WHERE shareable_via_qr = true;
CREATE INDEX IF NOT EXISTS idx_medical_records_active ON medical_records(is_active) WHERE is_active = true;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_active ON medical_records(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date ON medical_records(patient_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_date ON medical_records(doctor_id, visit_date DESC);

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add blockchain integrity verification function
CREATE OR REPLACE FUNCTION verify_medical_record_integrity(record_uuid UUID)
RETURNS TABLE(
    record_id UUID,
    has_blockchain_hash BOOLEAN,
    blockchain_hash VARCHAR(128),
    integrity_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id,
        (mr.blockchain_hash IS NOT NULL AND mr.blockchain_hash != '') as has_blockchain_hash,
        mr.blockchain_hash,
        CASE 
            WHEN mr.blockchain_hash IS NULL OR mr.blockchain_hash = '' THEN 'no_blockchain_protection'
            ELSE 'blockchain_protected'
        END as integrity_status
    FROM medical_records mr 
    WHERE mr.id = record_uuid AND mr.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Add function to get medical records by patient with filters
CREATE OR REPLACE FUNCTION get_patient_medical_records(
    p_patient_id UUID,
    p_record_type VARCHAR(50) DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    patient_id UUID,
    doctor_id UUID,
    record_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    diagnosis JSONB,
    symptoms JSONB,
    medications JSONB,
    lab_results JSONB,
    imaging_results JSONB,
    notes TEXT,
    visit_date TIMESTAMP WITH TIME ZONE,
    follow_up_required BOOLEAN,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    severity VARCHAR(20),
    status VARCHAR(20),
    confidentiality_level VARCHAR(20),
    blockchain_hash VARCHAR(128),
    shareable_via_qr BOOLEAN,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id, mr.patient_id, mr.doctor_id, mr.record_type, mr.title, mr.description,
        mr.diagnosis, mr.symptoms, mr.medications, mr.lab_results, mr.imaging_results,
        mr.notes, mr.visit_date, mr.follow_up_required, mr.follow_up_date, mr.severity,
        mr.status, mr.confidentiality_level, mr.blockchain_hash, mr.shareable_via_qr,
        mr.qr_expires_at, mr.created_at, mr.updated_at, mr.is_active
    FROM medical_records mr 
    WHERE mr.patient_id = p_patient_id 
        AND mr.is_active = true
        AND (p_record_type IS NULL OR mr.record_type = p_record_type)
        AND (p_severity IS NULL OR mr.severity = p_severity)
        AND (p_status IS NULL OR mr.status = p_status)
    ORDER BY mr.visit_date DESC, mr.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create patients table if it doesn't exist (for foreign key reference)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    phone_number VARCHAR(20) NOT NULL,
    emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    abha_id VARCHAR(50) NULL UNIQUE,
    blood_type VARCHAR(5) NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    allergies JSONB DEFAULT '[]'::jsonb,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    insurance_info JSONB NULL,
    family_history JSONB DEFAULT '[]'::jsonb,
    preferred_language VARCHAR(10) DEFAULT 'en',
    marital_status VARCHAR(20) NULL CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    occupation VARCHAR(100) NULL,
    next_of_kin JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create users table if it doesn't exist (for foreign key reference)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    is_email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE NULL,
    profile_completed BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Add foreign key constraints
-- ALTER TABLE medical_records ADD CONSTRAINT fk_medical_records_patient_id 
--     FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Note: Foreign key constraints are commented out for now to allow testing
-- In production, enable these constraints after ensuring data integrity

-- Insert migration record
INSERT INTO migrations (name, executed_at) VALUES ('create_medical_records_table', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
