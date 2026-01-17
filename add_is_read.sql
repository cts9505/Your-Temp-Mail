-- Add is_read column to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Update existing emails to be marked as read (optional)
-- UPDATE emails SET is_read = FALSE;
