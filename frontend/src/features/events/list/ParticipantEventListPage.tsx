import { Link } from 'react-router-dom';
import EventPeriod from './common/EventPeriod';
import type { ParticipantEventListServiceFactory } from './participant/useParticipantEventListService';
import { useParticipantEventListService } from './participant/useParticipantEventListService';

interface ParticipantEventListPageProps {
  serviceFactory?: ParticipantEventListServiceFactory;
}

const ParticipantEventListPage = ({
  serviceFactory = useParticipantEventListService
}: ParticipantEventListPageProps) => {
  const { events, loading, error, retry } = serviceFactory();
  const headingId = 'participant-event-list-heading';

  return (
    <main aria-labelledby={headingId}>
      <h1 id={headingId}>公開イベント一覧</h1>
      {loading && (
        <p role="status" aria-live="polite">
          読み込み中...
        </p>
      )}
      {!loading && error && (
        <div>
          <p role="alert">{error}</p>
          <button type="button" onClick={retry}>
            再試行
          </button>
        </div>
      )}
      {!loading && !error && events.length === 0 && <p>公開中のイベントはありません。</p>}
      {!loading && !error && events.length > 0 && (
        <table aria-label="公開イベント一覧">
          <thead>
            <tr>
              <th scope="col">イベント名</th>
              <th scope="col">開催期間</th>
              <th scope="col">公開ページ</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.eventId}>
                <td>{event.eventName}</td>
                <td>
                  <EventPeriod startDate={event.startDate} endDate={event.endDate} />
                </td>
                <td>
                  <Link
                    to={`/public/events/${event.eventId}`}
                    aria-label={`イベント「${event.eventName}」の公開ページ`}
                  >
                    公開ページへ
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default ParticipantEventListPage;
