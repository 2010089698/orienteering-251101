import { renderHook, waitFor } from '@testing-library/react';
import { EventApiError } from '../../api/eventApi';
import { useOrganizerEventDetailService } from '../useOrganizerEventDetailService';
import type { OrganizerEventDetailResponse } from '@shared/event/contracts/OrganizerEventDetailContract';

describe('useOrganizerEventDetailService', () => {
  const detail: OrganizerEventDetailResponse = {
    eventId: 'EVT-001',
    eventName: '春の大会',
    startDate: '2024-04-01',
    endDate: '2024-04-02',
    isMultiDayEvent: true,
    isMultiRaceEvent: false,
    raceSchedules: [{ name: 'Day1', date: '2024-04-01' }],
    entryReceptionStatus: 'NOT_REGISTERED',
    startListStatus: 'NOT_CREATED',
    resultPublicationStatus: 'NOT_PUBLISHED'
  };

  test('イベントID未指定時はエラーメッセージを返す', async () => {
    const { result } = renderHook(() =>
      useOrganizerEventDetailService({
        eventId: ''
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('イベントIDが指定されていません。');
    expect(result.current.detail).toBeNull();
  });

  test('EventApiError のメッセージをUIに伝搬する', async () => {
    const fetchEventDetail = jest
      .fn()
      .mockRejectedValue(new EventApiError('イベント詳細の取得に失敗しました。', 500));

    const { result } = renderHook(() =>
      useOrganizerEventDetailService({
        eventId: 'EVT-001',
        gateway: {
          fetchEventDetail
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEventDetail).toHaveBeenCalledWith('EVT-001', expect.any(AbortSignal));
    expect(result.current.error).toBe('イベント詳細の取得に失敗しました。');
    expect(result.current.detail).toBeNull();
  });

  test('APIから取得した詳細情報を保持する', async () => {
    const fetchEventDetail = jest.fn().mockResolvedValue(detail);

    const { result } = renderHook(() =>
      useOrganizerEventDetailService({
        eventId: 'EVT-001',
        gateway: {
          fetchEventDetail
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEventDetail).toHaveBeenCalledWith('EVT-001', expect.any(AbortSignal));
    expect(result.current.detail).toEqual(detail);
    expect(result.current.error).toBeNull();
  });
});
