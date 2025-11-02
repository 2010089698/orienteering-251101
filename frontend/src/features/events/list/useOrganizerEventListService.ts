import { useCallback, useEffect, useMemo, useState } from 'react';
import { EventApiError, fetchOrganizerEvents } from '../api/eventApi';
import type { EventSummary } from '@shared/event/contracts/EventSummaryContract';

export interface OrganizerEventListGateway {
  fetchEvents: (signal?: AbortSignal) => Promise<EventSummary[]>;
}

export interface UseOrganizerEventListServiceOptions {
  gateway?: OrganizerEventListGateway;
}

export interface OrganizerEventListServiceState {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export type OrganizerEventListServiceFactory = (
  options?: UseOrganizerEventListServiceOptions
) => OrganizerEventListServiceState;

const FALLBACK_ERROR_MESSAGE = 'イベント一覧の取得に失敗しました。';

export const useOrganizerEventListService: OrganizerEventListServiceFactory = (
  options
) => {
  const gateway = useMemo<OrganizerEventListGateway>(
    () => ({
      fetchEvents: options?.gateway?.fetchEvents ?? fetchOrganizerEvents
    }),
    [options?.gateway?.fetchEvents]
  );

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const retry = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    let mounted = true;

    setLoading(true);
    setError(null);

    gateway
      .fetchEvents(abortController.signal)
      .then((response) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setEvents(response);
      })
      .catch((caughtError) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        const message =
          caughtError instanceof EventApiError
            ? caughtError.message
            : FALLBACK_ERROR_MESSAGE;
        setError(message);
        setEvents([]);
      })
      .finally(() => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [gateway, refreshToken]);

  return {
    events,
    loading,
    error,
    retry
  };
};

export default useOrganizerEventListService;
