import { useQuery } from '@tanstack/react-query'
import {
  fetchAiChatConversations,
  fetchAiChatMessages,
} from '../../libs/ai-api'

export const aiChatConversationsQueryKey = ['ai', 'chat', 'conversations'] as const
export const aiChatMessagesQueryKey = (conversationId: string) =>
  ['ai', 'chat', 'messages', conversationId] as const

export function useAiChatConversations(enabled = true) {
  return useQuery({
    queryKey: aiChatConversationsQueryKey,
    queryFn: fetchAiChatConversations,
    enabled,
  })
}

export function useAiChatMessages(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: aiChatMessagesQueryKey(conversationId),
    queryFn: () => fetchAiChatMessages(conversationId),
    enabled: enabled && Boolean(conversationId),
  })
}
