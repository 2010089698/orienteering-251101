import { act, renderHook, waitFor } from '@testing-library/react';
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
    isPublic: false,
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

  test('公開API呼び出し後に再取得が行われる', async () => {
    const fetchEventDetail = jest.fn().mockResolvedValue(detail);
    const publishEvent = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOrganizerEventDetailService({
        eventId: 'EVT-001',
        gateway: {
          fetchEventDetail,
          publishEvent
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEventDetail).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.publish();
    });

    await waitFor(() => {
      expect(publishEvent).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(fetchEventDetail).toHaveBeenCalledTimes(2);
    });
  });

  test('公開APIが失敗した場合はエラーメッセージを保持する', async () => {
    const fetchEventDetail = jest.fn().mockResolvedValue(detail);
    const publishEvent = jest
      .fn()
      .mockRejectedValue(new EventApiError('公開に失敗しました。', 400));

    const { result } = renderHook(() =>
      useOrganizerEventDetailService({
        eventId: 'EVT-001',
        gateway: {
          fetchEventDetail,
          publishEvent
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.publish();
    });

    await waitFor(() => {
      expect(result.current.publishError).toBe('公開に失敗しました。');
      expect(result.current.publishing).toBe(false);
    });
  });
});
