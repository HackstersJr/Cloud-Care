-- QR Code Sharing Tables Migration
-- Date: 2024-01-XX
-- Purpose: Create tables for QR-based medical record sharing with blockchain consent

-- QR Share Tokens table
CREATE TABLE IF NOT EXISTS qr_share_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_ids TEXT[] NOT NULL, -- Array of medical record IDs
    facility_id VARCHAR(255), -- Optional facility that can access
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('full', 'summary', 'emergency')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    blockchain_hash VARCHAR(255) NOT NULL, -- Hash of blockchain consent record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_share_tokens_token ON qr_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_share_tokens_user_id ON qr_share_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_share_tokens_expires_at ON qr_share_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_share_tokens_revoked ON qr_share_tokens(revoked);

-- Add QR sharing columns to medical_records table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'shareable_via_qr') THEN
        ALTER TABLE medical_records ADD COLUMN shareable_via_qr BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'qr_expires_at') THEN
        ALTER TABLE medical_records ADD COLUMN qr_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_share_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_qr_share_tokens_updated_at ON qr_share_tokens;
CREATE TRIGGER trigger_update_qr_share_tokens_updated_at
    BEFORE UPDATE ON qr_share_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_qr_share_tokens_updated_at();

-- Create a view for active QR tokens
CREATE OR REPLACE VIEW active_qr_tokens AS
SELECT 
    qst.*,
    u.email as user_email,
    u.first_name,
    u.last_name,
    CASE 
        WHEN qst.expires_at > NOW() AND qst.revoked = FALSE THEN 'active'
        WHEN qst.expires_at <= NOW() THEN 'expired'
        WHEN qst.revoked = TRUE THEN 'revoked'
        ELSE 'inactive'
    END as status
FROM qr_share_tokens qst
JOIN users u ON qst.user_id = u.id;

-- Grant necessary permissions (adjust role names as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON qr_share_tokens TO backend_user;
-- GRANT SELECT ON active_qr_tokens TO backend_user;

-- Add comments for documentation
COMMENT ON TABLE qr_share_tokens IS 'Stores QR code tokens for sharing medical records with blockchain consent management';
COMMENT ON COLUMN qr_share_tokens.token IS 'Unique UUID token used in QR codes';
COMMENT ON COLUMN qr_share_tokens.record_ids IS 'Array of medical record IDs that can be accessed';
COMMENT ON COLUMN qr_share_tokens.share_type IS 'Type of sharing: full, summary, or emergency';
COMMENT ON COLUMN qr_share_tokens.blockchain_hash IS 'Hash of the blockchain consent transaction';
COMMENT ON VIEW active_qr_tokens IS 'View showing QR tokens with their current status';
