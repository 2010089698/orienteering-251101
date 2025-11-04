import { act, renderHook, waitFor } from '@testing-library/react';
import { EventApiError } from '../../../api/eventApi';
import { useParticipantEventDetailService } from '../useParticipantEventDetailService';
import type { PublicEventDetailResponse } from '@shared/event/contracts/PublicEventDetailContract';

describe('useParticipantEventDetailService', () => {
  const detail: PublicEventDetailResponse = {
    eventId: 'EVT-100',
    eventName: '公開イベント',
    startDate: '2024-06-01',
    endDate: '2024-06-02',
    isMultiDayEvent: true,
    isMultiRaceEvent: false,
    raceSchedules: [
      { name: 'Day1', date: '2024-06-01' },
      { name: 'Day2', date: '2024-06-02' }
    ],
    entryReceptionStatus: 'OPEN',
    startListStatus: 'PUBLISHED',
    resultPublicationStatus: 'PUBLISHED'
  };

  test('APIから取得した公開イベント詳細を保持する', async () => {
    const fetchEventDetail = jest.fn().mockResolvedValue(detail);

    const { result } = renderHook(() =>
      useParticipantEventDetailService({
        eventId: 'EVT-100',
        gateway: { fetchEventDetail }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEventDetail).toHaveBeenCalledWith('EVT-100', expect.any(AbortSignal));
    expect(result.current.detail).toEqual(detail);
    expect(result.current.error).toBeNull();
  });

  test('EventApiError のメッセージを保持する', async () => {
    const fetchEventDetail = jest
      .fn()
      .mockRejectedValue(new EventApiError('公開イベント詳細の取得に失敗しました。', 500));

    const { result } = renderHook(() =>
      useParticipantEventDetailService({
        eventId: 'EVT-200',
        gateway: { fetchEventDetail }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('公開イベント詳細の取得に失敗しました。');
    expect(result.current.detail).toBeNull();
  });

  test('再試行を実行すると再度API呼び出しを行う', async () => {
    const fetchEventDetail = jest
      .fn()
      .mockRejectedValueOnce(new EventApiError('一時的な失敗', 503))
      .mockResolvedValueOnce(detail);

    const { result } = renderHook(() =>
      useParticipantEventDetailService({
        eventId: 'EVT-300',
        gateway: { fetchEventDetail }
      })
    );

    await waitFor(() => {
      expect(result.current.error).toBe('一時的な失敗');
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(fetchEventDetail).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(result.current.detail).toEqual(detail);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });
});
