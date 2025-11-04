import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantEventDetailPage from '../ParticipantEventDetailPage';
import type { ParticipantEventDetailServiceFactory, ParticipantEventDetailServiceState } from '../participant/useParticipantEventDetailService';

describe('ParticipantEventDetailPage', () => {
  const renderWithPath = (
    serviceFactory: ParticipantEventDetailServiceFactory,
    initialEntry = '/public/events/event-1'
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/public/events/:eventId"
            element={<ParticipantEventDetailPage serviceFactory={serviceFactory} />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  test('読み込み中の状態を表示する', () => {
    const serviceFactory: ParticipantEventDetailServiceFactory = () => ({
      detail: null,
      loading: true,
      error: null,
      retry: jest.fn()
    });

    renderWithPath(serviceFactory);

    expect(screen.getByRole('heading', { name: 'イベント情報' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('読み込み中...');
  });

  test('エラー状態ではメッセージと再試行ボタンを表示する', async () => {
    const retry = jest.fn();
    const serviceFactory: ParticipantEventDetailServiceFactory = () => ({
      detail: null,
      loading: false,
      error: '取得に失敗しました。',
      retry
    });

    renderWithPath(serviceFactory);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('取得に失敗しました。');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '再試行' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test('公開イベント詳細を表示する', () => {
    const serviceFactory: ParticipantEventDetailServiceFactory = () => ({
      loading: false,
      error: null,
      retry: jest.fn(),
      detail: {
        eventId: 'event-1',
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
      }
    });

    renderWithPath(serviceFactory);

    expect(screen.getByRole('heading', { name: 'イベント情報' })).toBeInTheDocument();
    const overview = screen.getByRole('region', { name: 'イベント概要' });
    expect(overview).toBeInTheDocument();
    const raceRegion = screen.getByRole('region', { name: 'レース日程' });
    expect(raceRegion).toBeInTheDocument();
    const participantRegion = screen.getByRole('region', { name: '参加者向けリンク' });
    expect(participantRegion).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: '公開イベント' })).toBeInTheDocument();
    expect(screen.getByText(/開催期間/)).toBeInTheDocument();

    const raceList = within(raceRegion).getByRole('list');
    const items = within(raceList).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Day1');
    expect(items[1]).toHaveTextContent('Day2');

    expect(screen.getByRole('button', { name: 'エントリーする' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'スタートリストを見る' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リザルトを見る' })).toBeInTheDocument();
  });

  test('公開状態に応じてボタンの表示を切り替える', () => {
    const serviceFactory: ParticipantEventDetailServiceFactory = () => ({
      loading: false,
      error: null,
      retry: jest.fn(),
      detail: {
        eventId: 'event-2',
        eventName: '公開イベント2',
        startDate: '2024-07-01',
        endDate: '2024-07-01',
        isMultiDayEvent: false,
        isMultiRaceEvent: false,
        raceSchedules: [],
        entryReceptionStatus: 'CLOSED',
        startListStatus: 'DRAFT',
        resultPublicationStatus: 'NOT_PUBLISHED'
      }
    });

    renderWithPath(serviceFactory, '/public/events/event-2');

    expect(screen.getByText('エントリー受付は現在ご利用いただけません。')).toBeInTheDocument();
    expect(screen.getByText('スタートリストは公開されていません。')).toBeInTheDocument();
    expect(screen.getByText('リザルトは公開されていません。')).toBeInTheDocument();
    expect(screen.getByText('レース情報は公開されていません。')).toBeInTheDocument();
  });

  test('公開イベント一覧から詳細ページへの遷移をスモークテストする', async () => {
    const listState: ParticipantEventDetailServiceState = {
      detail: {
        eventId: 'event-3',
        eventName: '公開イベント3',
        startDate: '2024-08-01',
        endDate: '2024-08-02',
        isMultiDayEvent: true,
        isMultiRaceEvent: true,
        raceSchedules: [{ name: 'Final', date: '2024-08-02' }],
        entryReceptionStatus: 'OPEN',
        startListStatus: 'PUBLISHED',
        resultPublicationStatus: 'PUBLISHED'
      },
      loading: false,
      error: null,
      retry: jest.fn()
    };

    const serviceFactory: ParticipantEventDetailServiceFactory = () => listState;

    render(
      <MemoryRouter initialEntries={['/public/events']}>
        <Routes>
          <Route
            path="/public/events"
            element={
              <table>
                <tbody>
                  <tr>
                    <td>
                      <Link to="/public/events/event-3">公開ページへ</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            }
          />
          <Route
            path="/public/events/:eventId"
            element={<ParticipantEventDetailPage serviceFactory={serviceFactory} />}
          />
        </Routes>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: '公開ページへ' }));

    expect(await screen.findByRole('heading', { name: 'イベント情報' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '公開イベント3' })).toBeInTheDocument();
  });
});
