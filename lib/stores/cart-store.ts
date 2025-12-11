import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product, ProductVariant } from "@/lib/types"

interface CartItem {
  product: Product
  variant?: ProductVariant
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean

  // Computed
  totalItems: () => number
  subtotal: () => number

  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  setIsOpen: (open: boolean) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      subtotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant?.price || item.product.price
          return total + price * item.quantity
        }, 0)
      },

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.variant?.id === variant?.id,
          )

          if (existingIndex > -1) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += quantity
            return { items: newItems }
          }

          return {
            items: [...state.items, { product, variant, quantity }],
          }
        })
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter((item) => !(item.product.id === productId && item.variant?.id === variantId)),
        }))
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.variant?.id === variantId ? { ...item, quantity } : item,
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      setIsOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "gym-cart-storage",
    },
  ),
)
