-- Incremental migration: add birth date range and license fields to existing schema

-- Students: license fields
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS license_issued_at DATE,
  ADD COLUMN IF NOT EXISTS license_expires_at DATE,
  ADD COLUMN IF NOT EXISTS license_federation VARCHAR(100);

-- Groups: birth date range and license requirement
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS birth_date_from DATE,
  ADD COLUMN IF NOT EXISTS birth_date_to DATE,
  ADD COLUMN IF NOT EXISTS license_requirement VARCHAR(20) NOT NULL DEFAULT 'any';

-- Add CHECK constraint only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_groups_birth_date_range'
  ) THEN
    ALTER TABLE groups
      ADD CONSTRAINT chk_groups_birth_date_range CHECK (
        birth_date_from IS NULL OR birth_date_to IS NULL OR birth_date_from <= birth_date_to
      );
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_birth_date ON students(birth_date);
CREATE INDEX IF NOT EXISTS idx_students_is_licensed ON students(is_licensed);
CREATE INDEX IF NOT EXISTS idx_groups_birth_date_range ON groups(birth_date_from, birth_date_to);
CREATE INDEX IF NOT EXISTS idx_groups_license_requirement ON groups(license_requirement);

SELECT 'Birth/license columns added successfully' AS message;
