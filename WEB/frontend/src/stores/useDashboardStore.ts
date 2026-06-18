import { create } from 'zustand'

export type DashboardTab = 'overview' | 'roadmaps' | 'courses' | 'activity'

export interface RoadmapFilterState {
  status: string
  targetLevel: string
  query: string
}

interface DashboardStore {
  activeTab: DashboardTab
  roadmapFilter: RoadmapFilterState
  setActiveTab: (tab: DashboardTab) => void
  setRoadmapFilter: (filter: Partial<RoadmapFilterState>) => void
  resetRoadmapFilter: () => void
}

const defaultRoadmapFilter: RoadmapFilterState = {
  status: 'all',
  targetLevel: 'all',
  query: '',
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeTab: 'overview',
  roadmapFilter: defaultRoadmapFilter,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setRoadmapFilter: (filter) =>
    set((state) => ({
      roadmapFilter: { ...state.roadmapFilter, ...filter },
    })),
  resetRoadmapFilter: () => set({ roadmapFilter: defaultRoadmapFilter }),
}))
