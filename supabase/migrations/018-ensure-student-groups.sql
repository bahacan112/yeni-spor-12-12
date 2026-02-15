CREATE TABLE IF NOT EXISTS public.student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  joined_at DATE DEFAULT CURRENT_DATE,
  left_at DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_student_groups_group ON public.student_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_student ON public.student_groups(student_id);
