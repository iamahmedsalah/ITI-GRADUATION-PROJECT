import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAiChatConversation,
  deleteAiChatConversation,
  explainAiRoadmapTopic,
  generateUserAiRoadmapDraft,
  renameAiChatConversation,
  saveUserAiRoadmap,
  sendAiChatMessage,
} from '../../libs/ai-api'
import { aiAccessQueryKey } from '../queries/useAiAccess'
import { aiChatConversationsQueryKey } from '../queries/useAiChat'
import { myRoadmapsQueryKey } from '../queries/useRoadmaps'

export function useGenerateAiRoadmapDraft() {
  return useMutation({
    mutationFn: generateUserAiRoadmapDraft,
  })
}

export function useSaveAiRoadmap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveUserAiRoadmap,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myRoadmapsQueryKey })
    },
  })
}

export function useExplainAiRoadmapTopic() {
  return useMutation({
    mutationFn: explainAiRoadmapTopic,
  })
}

export function useCreateAiChatConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAiChatConversation,
    onSuccess: async (payload) => {
      if (payload.access) {
        queryClient.setQueryData(aiAccessQueryKey, payload.access)
      }
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
  })
}

export function useSendAiChatMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversationId,
      input,
    }: {
      conversationId: string
      input: Parameters<typeof sendAiChatMessage>[1]
    }) => sendAiChatMessage(conversationId, input),
    onSuccess: async (payload) => {
      if (payload.access) {
        queryClient.setQueryData(aiAccessQueryKey, payload.access)
      }
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
  })
}

export function useRenameAiChatConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversationId,
      title,
    }: {
      conversationId: string
      title: string
    }) => renameAiChatConversation(conversationId, title),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: aiChatConversationsQueryKey })
    },
  })
}

export function useDeleteAiChatConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAiChatConversation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })
    },
  })
}
