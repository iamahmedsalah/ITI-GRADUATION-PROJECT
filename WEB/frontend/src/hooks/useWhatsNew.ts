import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../utils/api';

export interface WhatsNewFeature {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  iconName: string;
  badgeEn?: string;
  badgeAr?: string;
}

export interface WhatsNewVersionData {
  version: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  target: 'user' | 'admin';
  features: WhatsNewFeature[];
}

export interface SystemWhatsNewResponse {
  version: string;
  whatsNew: WhatsNewVersionData[];
}

export function useSystemWhatsNew() {
  return useQuery({
    queryKey: ['system', 'whats-new'],
    queryFn: async () => {
      const { data } = await apiGet<SystemWhatsNewResponse>('/system/whats-new', {
        version: '1.0.0',
        whatsNew: [],
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWhatsNew(target: 'user' | 'admin') {
  const [isOpen, setIsOpen] = useState(false);
  const { data: systemData } = useSystemWhatsNew();

  const latestData = useMemo(() => {
    if (!systemData || !systemData.whatsNew) return null;
    const items = systemData.whatsNew.filter((item) => item.target === target);
    return items.length > 0 ? items[0] : null;
  }, [systemData, target]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    latestData,
    version: systemData?.version || '1.0.0',
    open,
    close,
    dismiss: close,
  };
}
