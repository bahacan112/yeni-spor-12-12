// Data Service - Centralized data fetching with Supabase integration
// This replaces mock data with real database queries

import { createClient } from "@/lib/supabase/client";

import type {
  Tenant,
  Branch,
  Student,
  Instructor,
  Group,
  Training,
  Venue,
  MonthlyDue,
  Application,
  RegistrationLink,
  Payment,
  Product,
  ProductCategory,
  DashboardStats,
} from "@/lib/types";

// Supabase client instance
const supabase = createClient();

// =====================================================
// TENANT OPERATIONS
// =====================================================

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (error) {
    console.error("Error fetching tenant:", error);
    return null;
  }

  return mapTenant(data);
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching tenant by slug:", error);
    return null;
  }

  return mapTenant(data);
}

export async function getAllTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }

  return data.map(mapTenant);
}

// =====================================================
// BRANCH OPERATIONS
// =====================================================

export async function getBranches(tenantId: string): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_main", { ascending: false });

  if (error) {
    console.error("Error fetching branches:", error);
    return [];
  }

  return data.map(mapBranch);
}

export async function getBranch(branchId: string): Promise<Branch | null> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", branchId)
    .single();

  if (error) {
    console.error("Error fetching branch:", error);
    return null;
  }

  return mapBranch(data);
}

// =====================================================
// STUDENT OPERATIONS
// =====================================================

export async function getStudents(
  tenantId: string,
  branchId?: string
): Promise<Student[]> {
  let query = supabase
    .from("students")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data.map(mapStudent);
}

export async function getStudent(studentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (error) {
    console.error("Error fetching student:", error);
    return null;
  }

  return mapStudent(data);
}

export async function getStudentsByGroup(groupId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("student_groups")
    .select(
      `
      student_id,
      students (*)
    `
    )
    .eq("group_id", groupId)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching students by group:", error);
    return [];
  }

  return data.map((item: any) => mapStudent(item.students));
}

// =====================================================
// INSTRUCTOR OPERATIONS
// =====================================================

export async function getInstructors(tenantId: string): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("full_name");

  if (error) {
    console.error("Error fetching instructors:", error);
    return [];
  }

  return data.map(mapInstructor);
}

export async function getInstructor(
  instructorId: string
): Promise<Instructor | null> {
  const { data, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("id", instructorId)
    .single();

  if (error) {
    console.error("Error fetching instructor:", error);
    return null;
  }

  return mapInstructor(data);
}

// =====================================================
// GROUP OPERATIONS
// =====================================================

export async function getGroups(
  tenantId: string,
  branchId?: string
): Promise<Group[]> {
  let query = supabase
    .from("groups")
    .select(
      `
      *,
      instructors!fk_groups_instructor (*)
      `
    )
    .eq("tenant_id", tenantId)
    .order("name");

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching groups:", error);
    return [];
  }

  return data.map((item: any) => mapGroup(item, item.instructors));
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select(
      `
      *,
      instructors!fk_groups_instructor (*)
      `
    )
    .eq("id", groupId)
    .single();

  if (error) {
    console.error("Error fetching group:", error);
    return null;
  }

  return mapGroup(data, data.instructors);
}

// =====================================================
// TRAINING OPERATIONS
// =====================================================

export async function getTrainings(
  tenantId: string,
  date?: string
): Promise<Training[]> {
  let query = supabase
    .from("trainings")
    .select(
      `
      *,
      groups (*),
      instructors (*),
      venues (*)
    `
    )
    .eq("tenant_id", tenantId)
    .order("training_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (date) {
    query = query.eq("training_date", date);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching trainings:", error);
    return [];
  }

  return data.map((item: any) => mapTraining(item));
}

export async function getTodayTrainings(tenantId: string): Promise<Training[]> {
  const today = new Date().toISOString().split("T")[0];
  return getTrainings(tenantId, today);
}

// =====================================================
// VENUE OPERATIONS
// =====================================================

export async function getVenues(
  tenantId: string,
  branchId?: string
): Promise<Venue[]> {
  let query = supabase
    .from("venues")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching venues:", error);
    return [];
  }

  return data.map(mapVenue);
}

// =====================================================
// MONTHLY DUES OPERATIONS
// =====================================================

export async function getMonthlyDues(
  tenantId: string,
  studentId?: string,
  status?: string
): Promise<MonthlyDue[]> {
  let query = supabase
    .from("monthly_dues")
    .select(
      `
      *,
      students (*)
    `
    )
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: false });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching monthly dues:", error);
    return [];
  }

  return data.map((item: any) => mapMonthlyDue(item));
}

export async function getPendingDues(tenantId: string): Promise<MonthlyDue[]> {
  const { data, error } = await supabase
    .from("monthly_dues")
    .select(
      `
      *,
      students (*)
    `
    )
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "partial", "overdue"])
    .order("due_date", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching pending dues:", error);
    return [];
  }

  return data.map((item: any) => mapMonthlyDue(item));
}

// =====================================================
// APPLICATION OPERATIONS
// =====================================================

export async function getApplications(
  tenantId: string,
  status?: string
): Promise<Application[]> {
  let query = supabase
    .from("applications")
    .select(
      `
      *,
      groups (*)
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  return data.map((item: any) => mapApplication(item));
}

// =====================================================
// REGISTRATION LINK OPERATIONS
// =====================================================

export async function getRegistrationLinks(
  tenantId: string
): Promise<RegistrationLink[]> {
  const { data, error } = await supabase
    .from("registration_links")
    .select(
      `
      *,
      groups (*)
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching registration links:", error);
    return [];
  }

  return data.map((item: any) => mapRegistrationLink(item));
}

// =====================================================
// PAYMENT OPERATIONS
// =====================================================

export async function getPayments(
  tenantId: string,
  limit?: number
): Promise<Payment[]> {
  let query = supabase
    .from("payments")
    .select(
      `
      *,
      students (*)
    `
    )
    .eq("tenant_id", tenantId)
    .order("payment_date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching payments:", error);
    return [];
  }

  return data.map((item: any) => mapPayment(item));
}

// =====================================================
// PRODUCT OPERATIONS
// =====================================================

export async function getProducts(
  tenantId: string,
  categoryId?: string
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_categories (*)
    `
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data.map((item: any) => mapProduct(item));
}

export async function getProductCategories(
  tenantId: string
): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }

  return data.map(mapProductCategory);
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export async function getDashboardStats(
  tenantId: string
): Promise<DashboardStats> {
  // Fetch all counts in parallel
  const [
    studentsResult,
    instructorsResult,
    groupsResult,
    todayTrainingsResult,
    pendingDuesResult,
    applicationsResult,
    monthlyRevenueResult,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id, status", { count: "exact" })
      .eq("tenant_id", tenantId),
    supabase
      .from("instructors")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("groups")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("trainings")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("training_date", new Date().toISOString().split("T")[0]),
    supabase
      .from("monthly_dues")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "partial", "overdue"]),
    supabase
      .from("applications")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "pending"),
    supabase
      .from("payments")
      .select("amount")
      .eq("tenant_id", tenantId)
      .gte(
        "payment_date",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      ),
  ]);

  const totalStudents = studentsResult.count || 0;
  const activeStudents =
    studentsResult.data?.filter((s: any) => s.status === "active").length || 0;

  const monthlyRevenue =
    monthlyRevenueResult.data?.reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0
    ) || 0;

  return {
    totalStudents,
    activeStudents,
    totalInstructors: instructorsResult.count || 0,
    totalGroups: groupsResult.count || 0,
    todayTrainings: todayTrainingsResult.count || 0,
    pendingPayments: pendingDuesResult.count || 0,
    pendingApplications: applicationsResult.count || 0,
    monthlyRevenue,
  };
}

// =====================================================
// MAPPER FUNCTIONS
// =====================================================

function mapTenant(data: any): Tenant {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    email: data.email,
    phone: data.phone,
    websiteEnabled: data.website_enabled,
    subscriptionPlan: data.subscription_plan,
    subscriptionStatus: data.subscription_status,
    isLimited: data.is_limited,
    maxStudents: data.max_students,
    maxGroups: data.max_groups,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapBranch(data: any): Branch {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    address: data.address,
    city: data.city,
    district: data.district,
    phone: data.phone,
    email: data.email,
    isMain: data.is_main,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapStudent(data: any): Student {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    studentNo: data.student_no,
    fullName: data.full_name,
    birthDate: data.birth_date,
    isLicensed: data.is_licensed,
    licenseNo: data.license_no,
    licenseIssuedAt: data.license_issued_at,
    licenseExpiresAt: data.license_expires_at,
    licenseFederation: data.license_federation,
    gender: data.gender,
    phone: data.phone,
    email: data.email,
    status: data.status,
    registrationDate: data.registration_date,
    photoUrl: data.photo_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapInstructor(data: any): Instructor {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    fullName: data.full_name,
    phone: data.phone,
    email: data.email,
    specialization: data.specialization,
    bio: data.bio,
    photoUrl: data.photo_url,
    hourlyRate: data.hourly_rate,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapGroup(data: any, instructor?: any): Group {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    name: data.name,
    sportType: data.sport_type,
    ageGroup: data.age_group,
    birthDateFrom: data.birth_date_from,
    birthDateTo: data.birth_date_to,
    licenseRequirement: data.license_requirement,
    capacity: data.capacity,
    monthlyFee: data.monthly_fee,
    instructorId: data.instructor_id,
    instructor: instructor ? mapInstructor(instructor) : undefined,
    schedule: data.schedule,
    status: data.status,
    studentCount: data.student_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapTraining(data: any): Training {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    groupId: data.group_id,
    group: data.groups ? mapGroup(data.groups) : undefined,
    instructorId: data.instructor_id,
    instructor: data.instructors ? mapInstructor(data.instructors) : undefined,
    venueId: data.venue_id,
    venue: data.venues ? mapVenue(data.venues) : undefined,
    title: data.title,
    trainingDate: data.training_date,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapVenue(data: any): Venue {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    name: data.name,
    type: data.type,
    capacity: data.capacity,
    hourlyRate: data.hourly_rate,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapMonthlyDue(data: any): MonthlyDue {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    studentId: data.student_id,
    student: data.students ? mapStudent(data.students) : undefined,
    dueMonth: data.due_month,
    amount: data.amount,
    paidAmount: data.paid_amount,
    dueDate: data.due_date,
    status: data.status,
    snapshotState: data.snapshot_state,
    paidAt: data.paid_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapApplication(data: any): Application {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    fullName: data.full_name,
    birthDate: data.birth_date,
    phone: data.phone,
    guardianName: data.guardian_name,
    guardianPhone: data.guardian_phone,
    preferredGroupId: data.preferred_group_id,
    preferredGroup: data.groups ? mapGroup(data.groups) : undefined,
    message: data.message,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

function mapRegistrationLink(data: any): RegistrationLink {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    groupId: data.group_id,
    group: data.groups ? mapGroup(data.groups) : undefined,
    code: data.code,
    title: data.title,
    description: data.description,
    maxUses: data.max_uses,
    usedCount: data.used_count,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

function mapPayment(data: any): Payment {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    studentId: data.student_id,
    student: data.students ? mapStudent(data.students) : undefined,
    monthlyDueId: data.monthly_due_id,
    amount: data.amount,
    paymentType: data.payment_type,
    paymentMethod: data.payment_method,
    description: data.description,
    paymentDate: data.payment_date,
    createdAt: data.created_at,
  };
}

function mapProduct(data: any): Product {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    categoryId: data.category_id,
    category: data.product_categories
      ? mapProductCategory(data.product_categories)
      : undefined,
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: data.price,
    comparePrice: data.compare_price,
    stockQuantity: data.stock_quantity,
    trackInventory: data.track_inventory,
    images: data.images || [],
    isActive: data.is_active,
    isFeatured: data.is_featured,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapProductCategory(data: any): ProductCategory {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    slug: data.slug,
    sortOrder: data.sort_order,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}
