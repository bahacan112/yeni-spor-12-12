import { create } from "zustand"
import type {
  Tenant,
  PlatformPlan,
  TenantSubscription,
  TenantPayment,
  NotificationTemplate,
  NotificationLog,
  ScheduledNotification,
  PlatformSetting,
  AdminDashboardStats,
} from "@/lib/types"

interface AdminState {
  // Dashboard
  stats: AdminDashboardStats | null
  isLoadingStats: boolean

  // Tenants (Schools)
  tenants: Tenant[]
  selectedTenant: Tenant | null
  isLoadingTenants: boolean

  // Platform Plans
  plans: PlatformPlan[]
  selectedPlan: PlatformPlan | null
  isLoadingPlans: boolean

  // Subscriptions
  subscriptions: TenantSubscription[]
  isLoadingSubscriptions: boolean

  // Tenant Payments
  tenantPayments: TenantPayment[]
  isLoadingTenantPayments: boolean

  // Notification Templates
  templates: NotificationTemplate[]
  selectedTemplate: NotificationTemplate | null
  isLoadingTemplates: boolean

  // Notification Logs
  notificationLogs: NotificationLog[]
  isLoadingLogs: boolean

  // Scheduled Notifications
  scheduledNotifications: ScheduledNotification[]
  isLoadingScheduled: boolean

  // Platform Settings
  settings: PlatformSetting[]
  isLoadingSettings: boolean

  // Actions
  setStats: (stats: AdminDashboardStats | null) => void
  setLoadingStats: (loading: boolean) => void

  setTenants: (tenants: Tenant[]) => void
  setSelectedTenant: (tenant: Tenant | null) => void
  addTenant: (tenant: Tenant) => void
  updateTenant: (id: string, data: Partial<Tenant>) => void
  removeTenant: (id: string) => void
  setLoadingTenants: (loading: boolean) => void

  setPlans: (plans: PlatformPlan[]) => void
  setSelectedPlan: (plan: PlatformPlan | null) => void
  addPlan: (plan: PlatformPlan) => void
  updatePlan: (id: string, data: Partial<PlatformPlan>) => void
  setLoadingPlans: (loading: boolean) => void

  setSubscriptions: (subscriptions: TenantSubscription[]) => void
  updateSubscription: (id: string, data: Partial<TenantSubscription>) => void
  setLoadingSubscriptions: (loading: boolean) => void

  setTenantPayments: (payments: TenantPayment[]) => void
  addTenantPayment: (payment: TenantPayment) => void
  setLoadingTenantPayments: (loading: boolean) => void

  setTemplates: (templates: NotificationTemplate[]) => void
  setSelectedTemplate: (template: NotificationTemplate | null) => void
  addTemplate: (template: NotificationTemplate) => void
  updateTemplate: (id: string, data: Partial<NotificationTemplate>) => void
  removeTemplate: (id: string) => void
  setLoadingTemplates: (loading: boolean) => void

  setNotificationLogs: (logs: NotificationLog[]) => void
  setLoadingLogs: (loading: boolean) => void

  setScheduledNotifications: (notifications: ScheduledNotification[]) => void
  addScheduledNotification: (notification: ScheduledNotification) => void
  updateScheduledNotification: (id: string, data: Partial<ScheduledNotification>) => void
  removeScheduledNotification: (id: string) => void
  setLoadingScheduled: (loading: boolean) => void

  setSettings: (settings: PlatformSetting[]) => void
  updateSetting: (key: string, value: string) => void
  setLoadingSettings: (loading: boolean) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  // Initial state
  stats: null,
  isLoadingStats: false,

  tenants: [],
  selectedTenant: null,
  isLoadingTenants: false,

  plans: [],
  selectedPlan: null,
  isLoadingPlans: false,

  subscriptions: [],
  isLoadingSubscriptions: false,

  tenantPayments: [],
  isLoadingTenantPayments: false,

  templates: [],
  selectedTemplate: null,
  isLoadingTemplates: false,

  notificationLogs: [],
  isLoadingLogs: false,

  scheduledNotifications: [],
  isLoadingScheduled: false,

  settings: [],
  isLoadingSettings: false,

  // Actions
  setStats: (stats) => set({ stats }),
  setLoadingStats: (isLoadingStats) => set({ isLoadingStats }),

  setTenants: (tenants) => set({ tenants }),
  setSelectedTenant: (selectedTenant) => set({ selectedTenant }),
  addTenant: (tenant) => set((state) => ({ tenants: [...state.tenants, tenant] })),
  updateTenant: (id, data) =>
    set((state) => ({
      tenants: state.tenants.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTenant: (id) =>
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
    })),
  setLoadingTenants: (isLoadingTenants) => set({ isLoadingTenants }),

  setPlans: (plans) => set({ plans }),
  setSelectedPlan: (selectedPlan) => set({ selectedPlan }),
  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
  updatePlan: (id, data) =>
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  setLoadingPlans: (isLoadingPlans) => set({ isLoadingPlans }),

  setSubscriptions: (subscriptions) => set({ subscriptions }),
  updateSubscription: (id, data) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  setLoadingSubscriptions: (isLoadingSubscriptions) => set({ isLoadingSubscriptions }),

  setTenantPayments: (tenantPayments) => set({ tenantPayments }),
  addTenantPayment: (payment) => set((state) => ({ tenantPayments: [...state.tenantPayments, payment] })),
  setLoadingTenantPayments: (isLoadingTenantPayments) => set({ isLoadingTenantPayments }),

  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  addTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (id, data) =>
    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  setLoadingTemplates: (isLoadingTemplates) => set({ isLoadingTemplates }),

  setNotificationLogs: (notificationLogs) => set({ notificationLogs }),
  setLoadingLogs: (isLoadingLogs) => set({ isLoadingLogs }),

  setScheduledNotifications: (scheduledNotifications) => set({ scheduledNotifications }),
  addScheduledNotification: (notification) =>
    set((state) => ({
      scheduledNotifications: [...state.scheduledNotifications, notification],
    })),
  updateScheduledNotification: (id, data) =>
    set((state) => ({
      scheduledNotifications: state.scheduledNotifications.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  removeScheduledNotification: (id) =>
    set((state) => ({
      scheduledNotifications: state.scheduledNotifications.filter((n) => n.id !== id),
    })),
  setLoadingScheduled: (isLoadingScheduled) => set({ isLoadingScheduled }),

  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: state.settings.map((s) => (s.key === key ? { ...s, value, updatedAt: new Date().toISOString() } : s)),
    })),
  setLoadingSettings: (isLoadingSettings) => set({ isLoadingSettings }),
}))
