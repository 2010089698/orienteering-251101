import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryReceptionManagementPage from '../EntryReceptionManagementPage';
import type { EntryReceptionManagementServiceState } from '../application/useEntryReceptionManagementService';

function renderPage(state: EntryReceptionManagementServiceState) {
  return render(
    <MemoryRouter initialEntries={['/events/EVT-001/entry-receptions']}>
      <Routes>
        <Route
          path="/events/:eventId/entry-receptions"
          element={<EntryReceptionManagementPage serviceFactory={() => state} />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('EntryReceptionManagementPage', () => {
  const baseState: EntryReceptionManagementServiceState = {
    loading: false,
    error: null,
    retry: jest.fn(),
    viewModel: {
      heading: '春の大会 エントリー受付管理',
      statusLabel: '受付中',
      statusDescription: '参加者からのエントリーを受け付けています。',
      tabs: [
        { id: 'SETTINGS', label: '受付設定', isActive: true },
        { id: 'PARTICIPANTS', label: '参加者', isActive: false }
      ],
      activeTabId: 'SETTINGS',
      selectTab: jest.fn(),
      settingsPanel: {
        races: [
          {
            raceId: 'RACE-1',
            label: 'レース1（ID: RACE-1）',
            receptionPeriodLabel: '受付期間: 2024-04-01T09:00:00+09:00 〜 2024-04-10T18:00:00+09:00',
            entryClassSummaries: [
              { classId: 'CLS-1', label: '男子エリート（定員 50名）' },
              { classId: 'CLS-2', label: '女子エリート（定員未設定）' }
            ]
          }
        ],
        emptyMessage: '受付設定がまだ登録されていません。',
        editButtonLabel: '受付設定を編集'
      },
      participantsPanel: {
        isEmpty: false,
        totalParticipantsLabel: '総参加者数: 2名',
        races: [
          {
            raceId: 'RACE-1',
            label: 'レース1（ID: RACE-1）',
            participantCountLabel: '参加者数: 2名',
            classes: [
              {
                classId: 'CLS-1',
                label: '男子エリート（定員 50名）',
                participantCountLabel: '参加者数: 2名',
                emptyMessage: 'このクラスの参加者はまだいません。',
                participants: [
                  {
                    entryId: 'ENTRY-1',
                    name: '山田 太郎',
                    email: 'taro@example.com',
                    submittedAtLabel: '2024-04-01T09:00:00Z'
                  }
                ]
              }
            ]
          }
        ],
        emptyMessage: '参加者はまだ登録されていません。',
        description: '各レース・クラスごとの最新のエントリー状況を確認できます。'
      }
    }
  };

  test('ローディング状態を表示する', () => {
    renderPage({ ...baseState, loading: true, viewModel: null });

    expect(screen.getByRole('status')).toHaveTextContent('読み込み中...');
  });

  test('エラー時に再試行ボタンを表示する', async () => {
    const retry = jest.fn();
    renderPage({ ...baseState, loading: false, error: '取得に失敗しました', retry, viewModel: null });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('取得に失敗しました');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '再試行' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test('ビューモデルを表示する', () => {
    renderPage(baseState);

    expect(screen.getByRole('heading', { name: '春の大会 エントリー受付管理' })).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '受付設定' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: '受付設定' })).toBeVisible();
    expect(screen.getByRole('button', { name: '受付設定を編集' })).toBeInTheDocument();
    expect(screen.getAllByText('男子エリート（定員 50名）')).toHaveLength(2);
    expect(screen.getByText('総参加者数: 2名')).toBeInTheDocument();
    expect(screen.getByText('山田 太郎')).toBeInTheDocument();
  });

  test('タブの選択操作をコールバックに委譲する', async () => {
    const selectTab = jest.fn();
    renderPage({
      ...baseState,
      viewModel: {
        ...baseState.viewModel!,
        tabs: [
          { id: 'SETTINGS', label: '受付設定', isActive: false },
          { id: 'PARTICIPANTS', label: '参加者', isActive: true }
        ],
        activeTabId: 'PARTICIPANTS',
        selectTab
      }
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: '受付設定' }));
    expect(selectTab).toHaveBeenCalledWith('SETTINGS');
  });
});
