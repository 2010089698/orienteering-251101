import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EventApiError,
  fetchOrganizerEventDetail,
  postPublishEvent
} from '../api/eventApi';
import type { OrganizerEventDetailResponse } from '@shared/event/contracts/OrganizerEventDetailContract';

export interface OrganizerEventDetailGateway {
  fetchEventDetail: (eventId: string, signal?: AbortSignal) => Promise<OrganizerEventDetailResponse>;
  publishEvent: (eventId: string, signal?: AbortSignal) => Promise<unknown>;
}

export interface UseOrganizerEventDetailServiceOptions {
  eventId: string;
  gateway?: OrganizerEventDetailGateway;
}

export interface OrganizerEventDetailServiceState {
  detail: OrganizerEventDetailResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  publishing: boolean;
  publishError: string | null;
  publish: () => void;
}

export type OrganizerEventDetailServiceFactory = (
  options: UseOrganizerEventDetailServiceOptions
) => OrganizerEventDetailServiceState;

const FALLBACK_ERROR_MESSAGE = 'イベント詳細の取得に失敗しました。';

export const useOrganizerEventDetailService: OrganizerEventDetailServiceFactory = (
  options
) => {
  const gateway = useMemo<OrganizerEventDetailGateway>(
    () => ({
      fetchEventDetail: options.gateway?.fetchEventDetail ?? fetchOrganizerEventDetail,
      publishEvent: options.gateway?.publishEvent ?? postPublishEvent
    }),
    [options.gateway?.fetchEventDetail, options.gateway?.publishEvent]
  );

  const [detail, setDetail] = useState<OrganizerEventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const retry = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!options.eventId || options.eventId.trim().length === 0) {
      setDetail(null);
      setError('イベントIDが指定されていません。');
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    let mounted = true;

    setLoading(true);
    setError(null);

    gateway
      .fetchEventDetail(options.eventId, abortController.signal)
      .then((response) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setDetail(response);
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
        setDetail(null);
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
  }, [gateway, options.eventId, refreshToken]);

  const publish = useCallback(() => {
    if (!options.eventId || options.eventId.trim().length === 0) {
      setPublishError('イベントIDが指定されていません。');
      return;
    }

    setPublishing(true);
    setPublishError(null);

    gateway
      .publishEvent(options.eventId)
      .then(() => {
        setRefreshToken((token) => token + 1);
      })
      .catch((caughtError) => {
        const message =
          caughtError instanceof EventApiError
            ? caughtError.message
            : 'イベントの公開に失敗しました。';
        setPublishError(message);
      })
      .finally(() => {
        setPublishing(false);
      });
  }, [gateway, options.eventId]);

  return {
    detail,
    loading,
    error,
    retry,
    publishing,
    publishError,
    publish
  };
};

export default useOrganizerEventDetailService;
