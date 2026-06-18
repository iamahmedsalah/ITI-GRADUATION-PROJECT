import { create } from 'zustand'

interface AiChatStore {
  activeConversationId: string | null
  draftMessage: string
  isSending: boolean
  setActiveConversation: (id: string | null) => void
  setDraftMessage: (message: string) => void
  setIsSending: (isSending: boolean) => void
  resetChatState: () => void
}

export const useAiChatStore = create<AiChatStore>((set) => ({
  activeConversationId: null,
  draftMessage: '',
  isSending: false,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setDraftMessage: (message) => set({ draftMessage: message }),
  setIsSending: (isSending) => set({ isSending }),
  resetChatState: () =>
    set({
      activeConversationId: null,
      draftMessage: '',
      isSending: false,
    }),
}))
