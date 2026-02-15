-- Merge student_guardians table into students table
-- 1. Add guardian columns to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(255);

-- 2. Migrate data from student_guardians to students
-- We prioritize 'is_primary' guardians, then fallback to the most recently created one.
UPDATE students s
SET
  guardian_name = g.full_name,
  guardian_phone = g.phone,
  guardian_email = g.email
FROM (
  SELECT DISTINCT ON (student_id) 
    student_id,
    full_name,
    phone,
    email
  FROM student_guardians
  ORDER BY student_id, is_primary DESC, created_at DESC
) g
WHERE s.id = g.student_id;

-- 3. Drop student_guardians table
DROP TABLE IF EXISTS student_guardians;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_guardian_name ON students(guardian_name);
CREATE INDEX IF NOT EXISTS idx_students_guardian_phone ON students(guardian_phone);

-- Optional: Drop emergency contact columns if they are now redundant, 
-- or keep them if they serve a different purpose. 
-- The user request implied replacing emergency contact usage with guardian info,
-- but didn't explicitly ask to DROP emergency columns. We'll leave them for safety 
-- or you can uncomment the lines below if you are sure.
-- ALTER TABLE students DROP COLUMN IF EXISTS emergency_contact_name;
-- ALTER TABLE students DROP COLUMN IF EXISTS emergency_contact_phone;
