-- Migration: Create consent management tables
-- Purpose: Create tables for managing patient consent requests and approvals
-- Date: 2025-09-13

-- Consent Requests table
CREATE TABLE consent_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    facility_id UUID, -- Optional: reference to requesting facility
    facility_name VARCHAR(255) NOT NULL, -- Name of requesting facility/doctor
    requestor_name VARCHAR(255) NOT NULL, -- Name of person making request
    requestor_email VARCHAR(255) NOT NULL,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('data_access', 'subscription', 'emergency_access', 'research')),
    purpose TEXT NOT NULL, -- Detailed purpose of the request
    permission_level VARCHAR(50) NOT NULL CHECK (permission_level IN ('read', 'write', 'full_access')),
    data_types TEXT[], -- Array of data types requested (e.g., ['medical_records', 'vitals', 'medications'])
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'revoked')),
    requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    denied_date TIMESTAMPTZ,
    revoked_date TIMESTAMPTZ,
    blockchain_hash VARCHAR(255), -- Hash of blockchain consent record (when approved)
    metadata JSONB DEFAULT '{}', -- Additional metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent Approvals table (for audit trail)
CREATE TABLE consent_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_request_id UUID NOT NULL REFERENCES consent_requests(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'denied', 'revoked')),
    reason TEXT, -- Optional reason for denial/revocation
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_consent_requests_patient_id ON consent_requests(patient_id);
CREATE INDEX idx_consent_requests_status ON consent_requests(status);
CREATE INDEX idx_consent_requests_facility_name ON consent_requests(facility_name);
CREATE INDEX idx_consent_requests_consent_type ON consent_requests(consent_type);
CREATE INDEX idx_consent_requests_requested_date ON consent_requests(requested_date);
CREATE INDEX idx_consent_approvals_consent_request_id ON consent_approvals(consent_request_id);
CREATE INDEX idx_consent_approvals_patient_id ON consent_approvals(patient_id);

-- Comments
COMMENT ON TABLE consent_requests IS 'Stores patient consent requests from healthcare facilities';
COMMENT ON TABLE consent_approvals IS 'Audit trail for consent approval/denial/revocation actions';
COMMENT ON COLUMN consent_requests.blockchain_hash IS 'Hash of the blockchain consent transaction when approved';
COMMENT ON COLUMN consent_requests.data_types IS 'Array of requested data types for granular consent';
COMMENT ON COLUMN consent_requests.metadata IS 'Additional metadata for the consent request';
