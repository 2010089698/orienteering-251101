import { act, renderHook, waitFor } from '@testing-library/react';
import { EventApiError } from '../../../api/eventApi';
import { useEntryReceptionManagementService } from '../application/useEntryReceptionManagementService';
import type { EntryReceptionPreparationResponse } from '../../../api/eventApi';

describe('useEntryReceptionManagementService', () => {
  const preparation: EntryReceptionPreparationResponse = {
    eventId: 'EVT-001',
    entryReceptionStatus: 'OPEN',
    raceReceptions: [
      {
        raceId: 'RACE-1',
        receptionStart: '2024-04-01T09:00:00+09:00',
        receptionEnd: '2024-04-10T18:00:00+09:00',
        entryClasses: [
          { classId: 'CLS-1', name: '男子エリート', capacity: 50 },
          { classId: 'CLS-2', name: '女子エリート' }
        ]
      }
    ]
  };

  test('イベントIDが未指定の場合にエラーを返す', async () => {
    const { result } = renderHook(() =>
      useEntryReceptionManagementService({
        eventId: '',
        eventName: '春の大会'
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('イベントIDが指定されていません。');
    expect(result.current.viewModel).toBeNull();
  });

  test('APIエラーのメッセージを伝搬する', async () => {
    const fetchEntryReceptionPreparation = jest
      .fn()
      .mockRejectedValue(new EventApiError('取得に失敗しました。', 500));

    const { result } = renderHook(() =>
      useEntryReceptionManagementService({
        eventId: 'EVT-001',
        eventName: '春の大会',
        gateway: {
          fetchEntryReceptionPreparation
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEntryReceptionPreparation).toHaveBeenCalledWith('EVT-001', expect.any(AbortSignal));
    expect(result.current.error).toBe('取得に失敗しました。');
    expect(result.current.viewModel).toBeNull();
  });

  test('エントリー受付情報をビューモデルに整形する', async () => {
    const fetchEntryReceptionPreparation = jest.fn().mockResolvedValue(preparation);

    const { result } = renderHook(() =>
      useEntryReceptionManagementService({
        eventId: 'EVT-001',
        eventName: '春の大会',
        gateway: {
          fetchEntryReceptionPreparation
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    const viewModel = result.current.viewModel;
    expect(viewModel).not.toBeNull();
    expect(viewModel?.heading).toBe('春の大会 エントリー受付管理');
    expect(viewModel?.statusLabel).toBe('受付中');
    expect(viewModel?.tabs).toEqual([
      expect.objectContaining({ id: 'SETTINGS', label: '受付設定', isActive: true }),
      expect.objectContaining({ id: 'PARTICIPANTS', label: '参加者', isActive: false })
    ]);
    expect(viewModel?.settingsPanel.races).toEqual([
      expect.objectContaining({
        raceId: 'RACE-1',
        receptionPeriodLabel: '受付期間: 2024-04-01T09:00:00+09:00 〜 2024-04-10T18:00:00+09:00'
      })
    ]);
    expect(viewModel?.participantsPanel.emptyMessage).toBe('参加者はまだ登録されていません。');

    act(() => {
      viewModel?.selectTab('PARTICIPANTS');
    });

    expect(result.current.viewModel?.activeTabId).toBe('PARTICIPANTS');
  });

  test('再試行でAPI呼び出しを繰り返す', async () => {
    const fetchEntryReceptionPreparation = jest
      .fn()
      .mockResolvedValue(preparation);

    const { result } = renderHook(() =>
      useEntryReceptionManagementService({
        eventId: 'EVT-001',
        gateway: {
          fetchEntryReceptionPreparation
        }
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchEntryReceptionPreparation).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(fetchEntryReceptionPreparation).toHaveBeenCalledTimes(2);
    });
  });
});
