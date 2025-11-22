import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface StartListNavigationServiceOptions {
  eventId: string;
}

export interface StartListNavigationServiceState {
  navigating: boolean;
  navigationError: string | null;
  navigateToCreate: () => void;
  navigateToManagement: () => void;
}

export type StartListNavigationServiceFactory = (
  options: StartListNavigationServiceOptions
) => StartListNavigationServiceState;

const FALLBACK_ERROR_MESSAGE = 'スタートリスト画面への遷移に失敗しました。';

export const useStartListNavigationService: StartListNavigationServiceFactory = (options) => {
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const paths = useMemo(
    () => ({
      create: `/events/${options.eventId}/start-lists/create`,
      management: `/events/${options.eventId}/start-lists`
    }),
    [options.eventId]
  );

  const handleNavigation = useCallback(
    (destination: 'create' | 'management') => {
      if (!options.eventId || options.eventId.trim().length === 0) {
        setNavigationError('イベントIDが指定されていません。');
        return;
      }

      setNavigating(true);
      setNavigationError(null);

      try {
        navigate(paths[destination]);
      } catch (error) {
        setNavigationError(FALLBACK_ERROR_MESSAGE);
      } finally {
        setNavigating(false);
      }
    },
    [navigate, options.eventId, paths]
  );

  const navigateToCreate = useCallback(() => handleNavigation('create'), [handleNavigation]);
  const navigateToManagement = useCallback(
    () => handleNavigation('management'),
    [handleNavigation]
  );

  return {
    navigating,
    navigationError,
    navigateToCreate,
    navigateToManagement
  };
};

export default useStartListNavigationService;
