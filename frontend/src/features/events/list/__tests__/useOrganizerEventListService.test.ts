import { renderHook, waitFor } from '@testing-library/react';
import { EventApiError } from '../../api/eventApi';
import { useOrganizerEventListService } from '../useOrganizerEventListService';

describe('useOrganizerEventListService', () => {
  test('EventApiError のメッセージをUIに伝搬する', async () => {
    const errorMessage = '主催者ID設定が必要です。環境変数 VITE_ORGANIZER_ID を設定してください。';
    const fetchEvents = jest.fn().mockRejectedValue(new EventApiError(errorMessage, 400));

    const { result } = renderHook(() =>
      useOrganizerEventListService({
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
