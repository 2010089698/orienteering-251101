import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import ParticipantEventDetailPage from '../ParticipantEventDetailPage';
import type {
  ParticipantEventDetailServiceFactory,
  ParticipantEventDetailServiceState
} from '../participant/useParticipantEventDetailService';

function createServiceFactory(
  state: Partial<ParticipantEventDetailServiceState>
): ParticipantEventDetailServiceFactory {
  return () => ({
    detail: null,
    loading: false,
    error: null,
    retry: jest.fn(),
    ...state
  });
}

describe('ParticipantEventDetailPage', () => {
  it('受付中の場合にエントリーリンクを表示する', () => {
    const serviceFactory = createServiceFactory({
      detail: {
        eventId: 'event-1',
        eventName: '公開イベント',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        isMultiDayEvent: true,
        isMultiRaceEvent: false,
        raceSchedules: [
          { name: 'race-1', date: '2024-06-01' }
        ],
        entryReceptionStatus: 'OPEN',
        startListStatus: 'NOT_CREATED',
        resultPublicationStatus: 'NOT_PUBLISHED'
      },
      loading: false,
      error: null
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1']}>
        <Routes>
          <Route
            path="/public/events/:eventId"
            element={<ParticipantEventDetailPage serviceFactory={serviceFactory} />}
          />
          <Route path="/public/events/:eventId/entries/new" element={<p>エントリー画面</p>} />
        </Routes>
      </MemoryRouter>
    );

    const entryLink = screen.getByRole('link', { name: 'エントリーする' });
    expect(entryLink).toHaveAttribute('href', '/public/events/event-1/entries/new');
  });

  it('受付が閉じている場合は案内メッセージを表示する', () => {
    const serviceFactory = createServiceFactory({
      detail: {
        eventId: 'event-1',
        eventName: '公開イベント',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        isMultiDayEvent: false,
        isMultiRaceEvent: false,
        raceSchedules: [],
        entryReceptionStatus: 'CLOSED',
        startListStatus: 'NOT_CREATED',
        resultPublicationStatus: 'NOT_PUBLISHED'
      },
      loading: false,
      error: null
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1']}>
        <Routes>
          <Route
            path="/public/events/:eventId"
            element={<ParticipantEventDetailPage serviceFactory={serviceFactory} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('エントリー受付は現在ご利用いただけません。')
    ).toBeInTheDocument();
  });

  it('公開状態に応じてボタンを表示する', () => {
    const serviceFactory = createServiceFactory({
      detail: {
        eventId: 'event-1',
        eventName: '公開イベント',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        isMultiDayEvent: false,
        isMultiRaceEvent: false,
        raceSchedules: [],
        entryReceptionStatus: 'OPEN',
        startListStatus: 'PUBLISHED',
        resultPublicationStatus: 'PUBLISHED'
      },
      loading: false,
      error: null
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1']}>
        <Routes>
          <Route
            path="/public/events/:eventId"
            element={<ParticipantEventDetailPage serviceFactory={serviceFactory} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'スタートリストを見る' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リザルトを見る' })).toBeInTheDocument();
  });
});
