-- Enhanced Database Schema for SMTP Mail Service
-- Run this in your Neon Database SQL Editor

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  alias VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (for auth sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Emails table (received from SMTP)
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID,
  recipient_alias VARCHAR(100) NOT NULL,
  sender VARCHAR(255),
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_recipient_alias (recipient_alias),
  INDEX idx_received_at (received_at DESC),
  INDEX idx_sender (sender),
  INDEX idx_is_read (is_read)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_emails_recipient_alias ON emails(recipient_alias);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Add full-text search capability (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_emails_search ON emails USING gin(
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body_text, '') || ' ' || coalesce(sender, ''))
);

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up old emails (adjust retention as needed)
-- This requires pg_cron extension (available in Neon)
-- SELECT cron.schedule('cleanup-old-emails', '0 2 * * *', 
--   'DELETE FROM emails WHERE received_at < NOW() - INTERVAL ''30 days''');
