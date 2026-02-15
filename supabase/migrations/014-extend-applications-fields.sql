-- Extend applications table with additional student-related fields
-- Adds gender and address to capture more data from website registration

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Optional indexes to help filtering/searching
CREATE INDEX IF NOT EXISTS idx_applications_gender ON applications(gender);
