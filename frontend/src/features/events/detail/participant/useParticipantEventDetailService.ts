import { useCallback, useEffect, useMemo, useState } from 'react';
import { EventApiError, fetchPublicEventDetail } from '../../api/eventApi';
import type { PublicEventDetailResponse } from '@shared/event/contracts/PublicEventDetailContract';

export interface ParticipantEventDetailGateway {
  fetchEventDetail: (eventId: string, signal?: AbortSignal) => Promise<PublicEventDetailResponse>;
}

export interface UseParticipantEventDetailServiceOptions {
  eventId: string;
  gateway?: ParticipantEventDetailGateway;
}

export interface ParticipantEventDetailServiceState {
  detail: PublicEventDetailResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export type ParticipantEventDetailServiceFactory = (
  options: UseParticipantEventDetailServiceOptions
) => ParticipantEventDetailServiceState;

const FALLBACK_ERROR_MESSAGE = '公開イベント詳細の取得に失敗しました。';

export const useParticipantEventDetailService: ParticipantEventDetailServiceFactory = (options) => {
  const gateway = useMemo<ParticipantEventDetailGateway>(
    () => ({
      fetchEventDetail: options.gateway?.fetchEventDetail ?? fetchPublicEventDetail
    }),
    [options.gateway?.fetchEventDetail]
  );

  const [detail, setDetail] = useState<PublicEventDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

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
          caughtError instanceof EventApiError ? caughtError.message : FALLBACK_ERROR_MESSAGE;
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

  return {
    detail,
    loading,
    error,
    retry
  };
};

export default useParticipantEventDetailService;
