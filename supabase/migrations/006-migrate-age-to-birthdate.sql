-- Migrate age_group text to birth_date_from/to using current date
-- Example formats expected: '6-8 yaş', '7-10 yaş', '13-16 yaş'

WITH parsed AS (
  SELECT 
    g.id,
    (regexp_matches(g.age_group, '([0-9]+)\s*-\s*([0-9]+)'))[1]::int AS min_age,
    (regexp_matches(g.age_group, '([0-9]+)\s*-\s*([0-9]+)'))[2]::int AS max_age
  FROM groups g
  WHERE g.age_group ~ '^[0-9]+\s*-\s*[0-9]+'
)
UPDATE groups gr
SET 
  birth_date_from = CURRENT_DATE - (parsed.max_age || ' years')::interval,
  birth_date_to = CURRENT_DATE - (parsed.min_age || ' years')::interval,
  license_requirement = COALESCE(gr.license_requirement, 'any')
FROM parsed
WHERE gr.id = parsed.id;

-- Optionally set license_requirement for specific groups by name (example)
-- UPDATE groups SET license_requirement = 'licensed' WHERE name ILIKE '%Yıldızlar%' AND license_requirement = 'any';

SELECT 'Age group migration completed' AS message;
