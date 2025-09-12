-- Migration: Add authentication tables
-- Created: 2025-09-12
-- Description: Add refresh tokens and password reset tokens tables

-- Refresh tokens table for JWT refresh functionality
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_ip INET,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(is_revoked);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(is_used);

-- Add updated_at trigger for refresh_tokens
CREATE TRIGGER refresh_tokens_updated_at 
    BEFORE UPDATE ON refresh_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for password_reset_tokens
CREATE TRIGGER password_reset_tokens_updated_at 
    BEFORE UPDATE ON password_reset_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
