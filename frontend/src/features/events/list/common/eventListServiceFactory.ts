import { useCallback, useEffect, useMemo, useState } from 'react';
import { EventApiError } from '../../api/eventApi';
import type { EventSummary } from '@shared/event/contracts/EventSummaryContract';

export interface EventListGateway {
  fetchEvents: (signal?: AbortSignal) => Promise<EventSummary[]>;
}

export interface UseEventListServiceOptions {
  gateway?: EventListGateway;
}

export interface EventListServiceState {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export type EventListServiceFactory = (
  options?: UseEventListServiceOptions
) => EventListServiceState;

interface EventListServiceFactoryConfig {
  defaultFetchEvents: EventListGateway['fetchEvents'];
  fallbackErrorMessage: string;
}

export function createEventListServiceFactory({
  defaultFetchEvents,
  fallbackErrorMessage
}: EventListServiceFactoryConfig): EventListServiceFactory {
  return (options) => {
    const gateway = useMemo<EventListGateway>(
      () => ({
        fetchEvents: options?.gateway?.fetchEvents ?? defaultFetchEvents
      }),
      [options?.gateway?.fetchEvents, defaultFetchEvents]
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
        .catch((caughtError: unknown) => {
          if (!mounted || abortController.signal.aborted) {
            return;
          }
          const message =
            caughtError instanceof EventApiError
              ? caughtError.message
              : fallbackErrorMessage;
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
    }, [gateway, refreshToken, fallbackErrorMessage]);

    return {
      events,
      loading,
      error,
      retry
    };
  };
}

export default createEventListServiceFactory;
