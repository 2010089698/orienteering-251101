import { Link, useParams } from 'react-router-dom';
import type {
  ParticipantEventDetailServiceFactory,
  ParticipantEventDetailServiceState,
  UseParticipantEventDetailServiceOptions
} from './participant/useParticipantEventDetailService';
import { useParticipantEventDetailService } from './participant/useParticipantEventDetailService';
import type {
  EntryReceptionStatus,
  ResultPublicationStatus,
  StartListStatus
} from '@shared/event/contracts/EventCommonSchemas';

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
    <main aria-labelledby={headingId}>
      <Link to="/public/events">公開イベント一覧に戻る</Link>
      <h1 id={headingId}>イベント情報</h1>
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
            <p>レース情報は公開されていません。</p>
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
      {!loading && !error && detail && (
        <section aria-label="参加者向けリンク">
          <h2>参加者向け情報</h2>
          <div>
            {detail.entryReceptionStatus === 'OPEN' ? (
              <button type="button">エントリーする</button>
            ) : (
              <p>エントリー受付は現在ご利用いただけません。</p>
            )}
          </div>
          <div>
            {detail.startListStatus === 'PUBLISHED' ? (
              <button type="button">スタートリストを見る</button>
            ) : (
              <p>スタートリストは公開されていません。</p>
            )}
          </div>
          <div>
            {detail.resultPublicationStatus === 'PUBLISHED' ? (
              <button type="button">リザルトを見る</button>
            ) : (
              <p>リザルトは公開されていません。</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

function translateEntryReceptionStatus(status: EntryReceptionStatus): string {
  switch (status) {
    case 'OPEN':
      return '受付中';
    case 'CLOSED':
      return '受付終了';
    default:
      return '未登録';
  }
}

function translateStartListStatus(status: StartListStatus): string {
  switch (status) {
    case 'DRAFT':
      return '作成中';
    case 'PUBLISHED':
      return '公開済み';
    default:
      return '未作成';
  }
}

function translateResultStatus(status: ResultPublicationStatus): string {
  switch (status) {
    case 'PUBLISHED':
      return '公開済み';
    default:
      return '未公開';
  }
}

export default ParticipantEventDetailPage;
