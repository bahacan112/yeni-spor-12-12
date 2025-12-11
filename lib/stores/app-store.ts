import { create } from "zustand"
import type {
  Student,
  Instructor,
  Group,
  Training,
  Venue,
  MonthlyDue,
  Application,
  RegistrationLink,
  Payment,
  DashboardStats,
} from "@/lib/types"

interface AppState {
  // Dashboard
  stats: DashboardStats | null
  isLoadingStats: boolean

  // Students
  students: Student[]
  selectedStudent: Student | null
  isLoadingStudents: boolean

  // Instructors
  instructors: Instructor[]
  selectedInstructor: Instructor | null
  isLoadingInstructors: boolean

  // Groups
  groups: Group[]
  selectedGroup: Group | null
  isLoadingGroups: boolean

  // Trainings
  trainings: Training[]
  todayTrainings: Training[]
  selectedTraining: Training | null
  isLoadingTrainings: boolean

  // Venues
  venues: Venue[]
  selectedVenue: Venue | null
  isLoadingVenues: boolean

  // Payments & Dues
  monthlyDues: MonthlyDue[]
  payments: Payment[]
  isLoadingPayments: boolean

  // Applications
  applications: Application[]
  isLoadingApplications: boolean

  // Registration Links
  registrationLinks: RegistrationLink[]
  isLoadingLinks: boolean

  // UI State
  sidebarOpen: boolean
  activeTab: string

  // Actions
  setStats: (stats: DashboardStats | null) => void
  setLoadingStats: (loading: boolean) => void

  setStudents: (students: Student[]) => void
  setSelectedStudent: (student: Student | null) => void
  addStudent: (student: Student) => void
  updateStudent: (id: string, data: Partial<Student>) => void
  removeStudent: (id: string) => void
  setLoadingStudents: (loading: boolean) => void

  setInstructors: (instructors: Instructor[]) => void
  setSelectedInstructor: (instructor: Instructor | null) => void
  addInstructor: (instructor: Instructor) => void
  updateInstructor: (id: string, data: Partial<Instructor>) => void
  removeInstructor: (id: string) => void
  setLoadingInstructors: (loading: boolean) => void

  setGroups: (groups: Group[]) => void
  setSelectedGroup: (group: Group | null) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, data: Partial<Group>) => void
  removeGroup: (id: string) => void
  setLoadingGroups: (loading: boolean) => void

  setTrainings: (trainings: Training[]) => void
  setTodayTrainings: (trainings: Training[]) => void
  setSelectedTraining: (training: Training | null) => void
  addTraining: (training: Training) => void
  updateTraining: (id: string, data: Partial<Training>) => void
  removeTraining: (id: string) => void
  setLoadingTrainings: (loading: boolean) => void

  setVenues: (venues: Venue[]) => void
  setSelectedVenue: (venue: Venue | null) => void
  setLoadingVenues: (loading: boolean) => void

  setMonthlyDues: (dues: MonthlyDue[]) => void
  updateMonthlyDue: (id: string, data: Partial<MonthlyDue>) => void
  setPayments: (payments: Payment[]) => void
  addPayment: (payment: Payment) => void
  setLoadingPayments: (loading: boolean) => void

  setApplications: (applications: Application[]) => void
  updateApplication: (id: string, data: Partial<Application>) => void
  setLoadingApplications: (loading: boolean) => void

  setRegistrationLinks: (links: RegistrationLink[]) => void
  addRegistrationLink: (link: RegistrationLink) => void
  removeRegistrationLink: (id: string) => void
  setLoadingLinks: (loading: boolean) => void

  setSidebarOpen: (open: boolean) => void
  setActiveTab: (tab: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  stats: null,
  isLoadingStats: false,

  students: [],
  selectedStudent: null,
  isLoadingStudents: false,

  instructors: [],
  selectedInstructor: null,
  isLoadingInstructors: false,

  groups: [],
  selectedGroup: null,
  isLoadingGroups: false,

  trainings: [],
  todayTrainings: [],
  selectedTraining: null,
  isLoadingTrainings: false,

  venues: [],
  selectedVenue: null,
  isLoadingVenues: false,

  monthlyDues: [],
  payments: [],
  isLoadingPayments: false,

  applications: [],
  isLoadingApplications: false,

  registrationLinks: [],
  isLoadingLinks: false,

  sidebarOpen: false,
  activeTab: "dashboard",

  // Actions
  setStats: (stats) => set({ stats }),
  setLoadingStats: (isLoadingStats) => set({ isLoadingStats }),

  setStudents: (students) => set({ students }),
  setSelectedStudent: (selectedStudent) => set({ selectedStudent }),
  addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
  updateStudent: (id, data) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  removeStudent: (id) =>
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
    })),
  setLoadingStudents: (isLoadingStudents) => set({ isLoadingStudents }),

  setInstructors: (instructors) => set({ instructors }),
  setSelectedInstructor: (selectedInstructor) => set({ selectedInstructor }),
  addInstructor: (instructor) => set((state) => ({ instructors: [...state.instructors, instructor] })),
  updateInstructor: (id, data) =>
    set((state) => ({
      instructors: state.instructors.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),
  removeInstructor: (id) =>
    set((state) => ({
      instructors: state.instructors.filter((i) => i.id !== id),
    })),
  setLoadingInstructors: (isLoadingInstructors) => set({ isLoadingInstructors }),

  setGroups: (groups) => set({ groups }),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
  addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
  updateGroup: (id, data) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...data } : g)),
    })),
  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
    })),
  setLoadingGroups: (isLoadingGroups) => set({ isLoadingGroups }),

  setTrainings: (trainings) => set({ trainings }),
  setTodayTrainings: (todayTrainings) => set({ todayTrainings }),
  setSelectedTraining: (selectedTraining) => set({ selectedTraining }),
  addTraining: (training) => set((state) => ({ trainings: [...state.trainings, training] })),
  updateTraining: (id, data) =>
    set((state) => ({
      trainings: state.trainings.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTraining: (id) =>
    set((state) => ({
      trainings: state.trainings.filter((t) => t.id !== id),
    })),
  setLoadingTrainings: (isLoadingTrainings) => set({ isLoadingTrainings }),

  setVenues: (venues) => set({ venues }),
  setSelectedVenue: (selectedVenue) => set({ selectedVenue }),
  setLoadingVenues: (isLoadingVenues) => set({ isLoadingVenues }),

  setMonthlyDues: (monthlyDues) => set({ monthlyDues }),
  updateMonthlyDue: (id, data) =>
    set((state) => ({
      monthlyDues: state.monthlyDues.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),
  setPayments: (payments) => set({ payments }),
  addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
  setLoadingPayments: (isLoadingPayments) => set({ isLoadingPayments }),

  setApplications: (applications) => set({ applications }),
  updateApplication: (id, data) =>
    set((state) => ({
      applications: state.applications.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  setLoadingApplications: (isLoadingApplications) => set({ isLoadingApplications }),

  setRegistrationLinks: (registrationLinks) => set({ registrationLinks }),
  addRegistrationLink: (link) =>
    set((state) => ({
      registrationLinks: [...state.registrationLinks, link],
    })),
  removeRegistrationLink: (id) =>
    set((state) => ({
      registrationLinks: state.registrationLinks.filter((l) => l.id !== id),
    })),
  setLoadingLinks: (isLoadingLinks) => set({ isLoadingLinks }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
}))
