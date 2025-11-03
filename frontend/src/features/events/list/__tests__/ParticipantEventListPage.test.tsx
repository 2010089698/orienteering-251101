import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantEventListPage from '../ParticipantEventListPage';
import type { ParticipantEventListServiceState } from '../participant/useParticipantEventListService';

describe('ParticipantEventListPage', () => {
  const renderWithState = (state: ParticipantEventListServiceState) => {
    return render(
      <MemoryRouter initialEntries={['/public/events']}>
        <Routes>
          <Route
            path="/public/events"
            element={<ParticipantEventListPage serviceFactory={() => state} />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  test('ローディング状態を表示する', () => {
    renderWithState({ events: [], loading: true, error: null, retry: jest.fn() });

    expect(screen.getByRole('heading', { name: '公開イベント一覧' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('読み込み中...');
  });

  test('エラー状態でメッセージと再試行ボタンを表示する', async () => {
    const retry = jest.fn();
    renderWithState({ events: [], loading: false, error: '取得に失敗しました', retry });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('取得に失敗しました');

    await userEvent.setup().click(screen.getByRole('button', { name: '再試行' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test('イベントが存在しない場合のメッセージを表示する', () => {
    renderWithState({ events: [], loading: false, error: null, retry: jest.fn() });

    expect(screen.getByText('公開中のイベントはありません。')).toBeInTheDocument();
  });

  test('イベント一覧をテーブルで表示する', () => {
    const state: ParticipantEventListServiceState = {
      loading: false,
      error: null,
      retry: jest.fn(),
      events: [
        {
          eventId: 'EVT-001',
          eventName: '春の大会',
          startDate: '2024-04-01',
          endDate: '2024-04-02',
          isMultiDayEvent: true,
          isMultiRaceEvent: false
        },
        {
          eventId: 'EVT-002',
          eventName: '夏の大会',
          startDate: '2024-08-10',
          endDate: '2024-08-10',
          isMultiDayEvent: false,
          isMultiRaceEvent: false
        }
      ]
    };

    renderWithState(state);

    const table = screen.getByRole('table', { name: '公開イベント一覧' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);

    const firstDataRowCells = within(rows[1]).getAllByRole('cell');
    expect(firstDataRowCells[0]).toHaveTextContent('春の大会');
    expect(firstDataRowCells[1]).toHaveTextContent('2024-04-01 〜 2024-04-02');

    const secondDataRowCells = within(rows[2]).getAllByRole('cell');
    expect(secondDataRowCells[0]).toHaveTextContent('夏の大会');
    expect(secondDataRowCells[1]).toHaveTextContent('2024-08-10 〜 2024-08-10');
  });

  test('公開ページリンクをクリックすると公開イベントページに遷移する', async () => {
    const state: ParticipantEventListServiceState = {
      events: [
        {
          eventId: 'EVT-001',
          eventName: '春の大会',
          startDate: '2024-04-01',
          endDate: '2024-04-02',
          isMultiDayEvent: true,
          isMultiRaceEvent: false
        }
      ],
      loading: false,
      error: null,
      retry: jest.fn()
    };

    render(
      <MemoryRouter initialEntries={['/public/events']}>
        <Routes>
          <Route
            path="/public/events"
            element={<ParticipantEventListPage serviceFactory={() => state} />}
          />
          <Route
            path="/public/events/:eventId"
            element={<div data-testid="public-event-detail-page">公開イベント詳細</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'イベント「春の大会」の公開ページ' }));

    expect(await screen.findByTestId('public-event-detail-page')).toBeInTheDocument();
  });
});
