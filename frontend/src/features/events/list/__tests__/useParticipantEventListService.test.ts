import { renderHook, waitFor } from '@testing-library/react';
import { EventApiError } from '../../api/eventApi';
import { useParticipantEventListService } from '../participant/useParticipantEventListService';

describe('useParticipantEventListService', () => {
  test('EventApiError のメッセージをUIに伝搬する', async () => {
    const errorMessage = '公開イベント一覧の取得に失敗しました。';
    const fetchEvents = jest.fn().mockRejectedValue(new EventApiError(errorMessage, 500));

    const { result } = renderHook(() =>
      useParticipantEventListService({
        gateway: {
          fetchEvents
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEvents).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.events).toEqual([]);
  });
});
