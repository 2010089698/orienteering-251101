import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizerEventDetailPage from '../OrganizerEventDetailPage';
import type { OrganizerEventDetailServiceState } from '../useOrganizerEventDetailService';

function renderWithState(state: OrganizerEventDetailServiceState) {
  return render(
    <MemoryRouter initialEntries={['/events/EVT-001']}>
      <Routes>
        <Route
          path="/events/:eventId"
          element={<OrganizerEventDetailPage serviceFactory={() => state} />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('OrganizerEventDetailPage', () => {
  const baseState: OrganizerEventDetailServiceState = {
    loading: false,
    error: null,
    retry: jest.fn(),
    publishing: false,
    publishError: null,
    publish: jest.fn(),
    detail: {
      eventId: 'EVT-001',
      eventName: '春の大会',
      startDate: '2024-04-01',
      endDate: '2024-04-02',
      isMultiDayEvent: true,
      isMultiRaceEvent: false,
      isPublic: false,
      raceSchedules: [
        { name: 'Day1', date: '2024-04-01' },
        { name: 'Day2', date: '2024-04-02' }
      ],
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    }
  };

  test('ローディング状態を表示する', () => {
    renderWithState({ ...baseState, loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('読み込み中...');
  });

  test('エラー状態でメッセージと再試行ボタンを表示する', async () => {
    const retry = jest.fn();
    renderWithState({ ...baseState, detail: null, error: '取得に失敗しました', retry });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('取得に失敗しました');

    await userEvent.setup().click(screen.getByRole('button', { name: '再試行' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test('イベント詳細情報を表示する', () => {
    renderWithState(baseState);

    expect(screen.getByRole('heading', { name: 'イベント詳細' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '春の大会' })).toBeInTheDocument();
    expect(screen.getByText(/開催期間/)).toBeInTheDocument();
    expect(screen.getByText('公開状態')).toBeInTheDocument();
    expect(screen.getByText('非公開')).toBeInTheDocument();

    const raceList = screen.getByRole('list');
    const raceItems = within(raceList).getAllByRole('listitem');
    expect(raceItems).toHaveLength(2);
  });

  test('ステータスに応じてボタン表示を切り替える', () => {
    const state: OrganizerEventDetailServiceState = {
      ...baseState,
      detail: {
        ...baseState.detail!,
        isPublic: true,
        entryReceptionStatus: 'OPEN',
        startListStatus: 'PUBLISHED',
        resultPublicationStatus: 'PUBLISHED'
      }
    };

    renderWithState(state);

    expect(screen.getByText('このイベントは公開済みです。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'エントリー受付を管理' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'スタートリストを管理' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '公開済みリザルトを見る' })).toBeInTheDocument();
  });

  test('未公開イベントの公開ボタンを押下できる', async () => {
    const publish = jest.fn();
    renderWithState({ ...baseState, publish });

    const button = screen.getByRole('button', { name: 'イベントを公開' });
    await userEvent.setup().click(button);

    expect(publish).toHaveBeenCalledTimes(1);
  });
});
