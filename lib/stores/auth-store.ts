import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Tenant, Branch } from "@/lib/types"

interface AuthState {
  user: User | null
  tenant: Tenant | null
  currentBranch: Branch | null
  branches: Branch[]
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setTenant: (tenant: Tenant | null) => void
  setCurrentBranch: (branch: Branch | null) => void
  setBranches: (branches: Branch[]) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      currentBranch: null,
      branches: [],
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setTenant: (tenant) => set({ tenant }),

      setCurrentBranch: (currentBranch) => set({ currentBranch }),

      setBranches: (branches) => set({ branches }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          tenant: null,
          currentBranch: null,
          branches: [],
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "gym-auth-storage",
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        currentBranch: state.currentBranch,
        branches: state.branches,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
