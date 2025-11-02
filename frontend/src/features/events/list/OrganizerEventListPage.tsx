import { Link } from 'react-router-dom';
import type { OrganizerEventListServiceFactory } from './useOrganizerEventListService';
import { useOrganizerEventListService } from './useOrganizerEventListService';

interface OrganizerEventListPageProps {
  serviceFactory?: OrganizerEventListServiceFactory;
}

const OrganizerEventListPage = ({
  serviceFactory = useOrganizerEventListService
}: OrganizerEventListPageProps) => {
  const { events, loading, error, retry } = serviceFactory();
  const headingId = 'organizer-event-list-heading';

  return (
    <main aria-labelledby={headingId}>
      <h1 id={headingId}>イベント一覧</h1>
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
      {!loading && !error && events.length === 0 && <p>登録されたイベントはありません。</p>}
      {!loading && !error && events.length > 0 && (
        <table aria-label="イベント一覧">
          <thead>
            <tr>
              <th scope="col">イベント名</th>
              <th scope="col">開催期間</th>
              <th scope="col">詳細</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.eventId}>
                <td>{event.eventName}</td>
                <td>
                  <time dateTime={event.startDate}>{event.startDate}</time>
                  {' 〜 '}
                  <time dateTime={event.endDate}>{event.endDate}</time>
                </td>
                <td>
                  <Link to={`/events/${event.eventId}`} aria-label={`イベント「${event.eventName}」の詳細`}>
                    詳細
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

export default OrganizerEventListPage;
