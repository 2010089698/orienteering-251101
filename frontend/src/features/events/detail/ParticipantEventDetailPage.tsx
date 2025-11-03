import { Link, useParams } from 'react-router-dom';
import type {
  OrganizerEventDetailServiceFactory as ParticipantEventDetailServiceFactory,
  OrganizerEventDetailServiceState as ParticipantEventDetailServiceState,
  UseOrganizerEventDetailServiceOptions as UseParticipantEventDetailServiceOptions
} from './useOrganizerEventDetailService';
import { useOrganizerEventDetailService as useParticipantEventDetailService } from './useOrganizerEventDetailService';

interface ParticipantEventDetailPageProps {
  serviceFactory?: ParticipantEventDetailServiceFactory;
}

function resolveService(
  factory: ParticipantEventDetailServiceFactory,
  eventId: string
): ParticipantEventDetailServiceState {
  const options: UseParticipantEventDetailServiceOptions = { eventId };
  return factory(options);
}

const ParticipantEventDetailPage = ({
  serviceFactory = useParticipantEventDetailService
}: ParticipantEventDetailPageProps) => {
  const { eventId = '' } = useParams<'eventId'>();
  const { detail, loading, error, retry } = resolveService(serviceFactory, eventId);
  const headingId = 'participant-event-detail-heading';

  return (
    <main aria-labelledby={headingId} data-testid="public-event-detail-page">
      <Link to="/public/events">公開イベント一覧に戻る</Link>
      <h1 id={headingId}>イベント公開情報</h1>
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
      {!loading && !error && detail && (
        <section aria-label="イベント概要">
          <h2>{detail.eventName}</h2>
          <p>
            開催期間:{' '}
            <time dateTime={detail.startDate}>{detail.startDate}</time>
            {' 〜 '}
            <time dateTime={detail.endDate}>{detail.endDate}</time>
          </p>
          <dl>
            <div>
              <dt>複数日開催</dt>
              <dd>{detail.isMultiDayEvent ? 'はい' : 'いいえ'}</dd>
            </div>
            <div>
              <dt>複数レース開催</dt>
              <dd>{detail.isMultiRaceEvent ? 'はい' : 'いいえ'}</dd>
            </div>
            <div>
              <dt>エントリー受付</dt>
              <dd>{translateEntryReceptionStatus(detail.entryReceptionStatus)}</dd>
            </div>
            <div>
              <dt>スタートリスト</dt>
              <dd>{translateStartListStatus(detail.startListStatus)}</dd>
            </div>
            <div>
              <dt>リザルト公開</dt>
              <dd>{translateResultStatus(detail.resultPublicationStatus)}</dd>
            </div>
          </dl>
        </section>
      )}
      {!loading && !error && detail && (
        <section aria-label="レース日程">
          <h2>レース日程</h2>
          {detail.raceSchedules.length === 0 ? (
            <p>登録されたレースはありません。</p>
          ) : (
            <ul>
              {detail.raceSchedules.map((race) => (
                <li key={race.name}>
                  <strong>{race.name}</strong>:{' '}
                  <time dateTime={race.date}>{race.date}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
};

function translateEntryReceptionStatus(status: string): string {
  switch (status) {
    case 'OPEN':
      return '受付中';
    case 'CLOSED':
      return '受付終了';
    default:
      return '未登録';
  }
}

function translateStartListStatus(status: string): string {
  switch (status) {
    case 'DRAFT':
      return '作成中';
    case 'PUBLISHED':
      return '公開済み';
    default:
      return '未作成';
  }
}

function translateResultStatus(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return '公開済み';
    default:
      return '未公開';
  }
}

export default ParticipantEventDetailPage;
