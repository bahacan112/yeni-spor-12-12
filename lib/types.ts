// Type definitions for the Gym Management System

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  email?: string;
  phone?: string;
  address?: string;
  websiteEnabled: boolean;
  websiteDomain?: string;
  subscriptionPlan: "basic" | "pro" | "enterprise";
  subscriptionStatus: "active" | "inactive" | "expired";
  subscriptionExpiresAt?: string;
  isLimited?: boolean;
  maxStudents?: number | null;
  maxGroups?: number | null;
  galleryImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId?: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role:
    | "super_admin"
    | "tenant_admin"
    | "branch_manager"
    | "instructor"
    | "student";
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  tenantId: string;
  branchId: string;
  userId?: string;
  studentNo?: string;
  fullName: string;
  birthDate?: string;
  isLicensed?: boolean;
  licenseNo?: string;
  licenseIssuedAt?: string;
  licenseExpiresAt?: string;
  licenseFederation?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  photoUrl?: string;
  registrationDate: string;
  status: "active" | "passive" | "suspended" | "graduated";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentGuardian {
  id: string;
  studentId: string;
  fullName: string;
  relationship?: "father" | "mother" | "guardian";
  phone?: string;
  email?: string;
  occupation?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Instructor {
  id: string;
  tenantId: string;
  userId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  specialization?: string;
  bio?: string;
  photoUrl?: string;
  hourlyRate?: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  description?: string;
  sportType?: string;
  ageGroup?: string;
  birthDateFrom?: string;
  birthDateTo?: string;
  licenseRequirement?: "any" | "licensed" | "unlicensed";
  capacity: number;
  monthlyFee?: number;
  instructorId?: string;
  instructor?: Instructor;
  schedule?: Record<string, string[]>;
  status: "active" | "inactive";
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  tenantId: string;
  branchId: string;
  groupId?: string;
  group?: Group;
  instructorId?: string;
  instructor?: Instructor;
  venueId?: string;
  venue?: Venue;
  title: string;
  description?: string;
  trainingDate: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  trainingId: string;
  studentId: string;
  student?: Student;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  markedBy?: string;
  markedAt: string;
  createdAt: string;
}

export interface Venue {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  type?: "indoor" | "outdoor" | "pool" | "other";
  capacity?: number;
  hourlyRate?: number;
  address?: string;
  description?: string;
  amenities?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  amount: number;
  period: "monthly" | "quarterly" | "yearly";
  isActive: boolean;
  createdAt: string;
}

export interface StudentSubscription {
  id: string;
  studentId: string;
  paymentPlanId: string;
  paymentPlan?: PaymentPlan;
  groupId?: string;
  startDate: string;
  endDate?: string;
  monthlyAmount: number;
  paymentDay: number;
  status: "active" | "paused" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyDue {
  id: string;
  tenantId: string;
  branchId: string;
  studentId: string;
  student?: Student;
  subscriptionId?: string;
  dueMonth: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: "pending" | "paid" | "partial" | "overdue";
  paidAt?: string;
  notes?: string;
  policyModelApplied?: string;
  participationCount?: number;
  freezeApplied?: boolean;
  appliedDiscountPercent?: number;
  computedAmount?: number;
  originalAmount?: number;
  calculationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  branchId?: string;
  studentId?: string;
  student?: Student;
  monthlyDueId?: string;
  orderId?: string;
  amount: number;
  paymentType: "dues" | "product" | "registration" | "other";
  paymentMethod?: "cash" | "credit_card" | "bank_transfer";
  referenceNo?: string;
  description?: string;
  receivedBy?: string;
  paymentDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  branchId?: string;
  category?: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  receiptUrl?: string;
  createdBy?: string;
  createdAt: string;
}

export interface RegistrationLink {
  id: string;
  tenantId: string;
  branchId?: string;
  groupId?: string;
  group?: Group;
  code: string;
  title?: string;
  description?: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  tenantId: string;
  branchId?: string;
  registrationLinkId?: string;
  fullName: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  preferredGroupId?: string;
  preferredGroup?: Group;
  message?: string;
  status: "pending" | "approved" | "rejected" | "contacted";
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  category?: ProductCategory;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stockQuantity: number;
  trackInventory: boolean;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price?: number;
  stockQuantity: number;
  attributes?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  branchId?: string;
  customerId?: string;
  studentId?: string;
  orderNo: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  shippingAddress?: Record<string, string>;
  billingAddress?: Record<string, string>;
  notes?: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface WebsitePage {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  content?: string;
  imageUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalInstructors: number;
  totalGroups: number;
  todayTrainings: number;
  pendingPayments: number;
  pendingApplications: number;
  monthlyRevenue: number;
}

// Platform Plan types for subscription management
export interface PlatformPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents?: number | null;
  maxGroups?: number | null;
  maxBranches?: number | null;
  maxInstructors?: number | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  planId: string;
  plan?: PlatformPlan;
  billingPeriod: "monthly" | "yearly";
  amount: number;
  status: "active" | "expired" | "cancelled" | "suspended";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  paymentMethod?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantPayment {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  subscriptionId?: string;
  amount: number;
  paymentMethod?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  invoiceNo?: string;
  description?: string;
  paidAt: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  tenantId?: string;
  type: string;
  channel: "sms" | "email" | "push";
  name: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  tenantId?: string;
  templateId?: string;
  template?: NotificationTemplate;
  recipientType: string;
  recipientId?: string;
  recipientContact: string;
  channel: "sms" | "email" | "push";
  subject?: string;
  content: string;
  status: "pending" | "sent" | "failed" | "delivered";
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface ScheduledNotification {
  id: string;
  tenantId?: string;
  templateId: string;
  template?: NotificationTemplate;
  triggerType: "days_before_due" | "days_after_due" | "subscription_expiry";
  triggerDays: number;
  targetAudience: string;
  isActive: boolean;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  description?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  tenantId?: string;
  tenant?: Tenant;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Admin Dashboard Stats
export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  expiredTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalStudents: number;
  pendingPayments: number;
  recentSignups: number;
}
