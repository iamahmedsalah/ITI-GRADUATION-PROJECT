import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface UiToast {
  id: string
  message: string
  tone?: ToastTone
}

interface UiStore {
  sidebarOpen: boolean
  activeModal: string | null
  toasts: UiToast[]
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  openModal: (id: string) => void
  closeModal: () => void
  addToast: (toast: Omit<UiToast, 'id'> & { id?: string }) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const createToastId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  addToast: (toast) => {
    const id = toast.id ?? createToastId()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}))
