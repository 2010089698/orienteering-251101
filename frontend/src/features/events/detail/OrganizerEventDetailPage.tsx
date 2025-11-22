import { Link, useParams } from 'react-router-dom';
import type {
  OrganizerEventDetailServiceFactory,
  OrganizerEventDetailServiceState,
  UseOrganizerEventDetailServiceOptions
} from './useOrganizerEventDetailService';
import { useOrganizerEventDetailService } from './useOrganizerEventDetailService';
import type {
  StartListNavigationServiceFactory,
  StartListNavigationServiceState
} from './useStartListNavigationService';
import { useStartListNavigationService } from './useStartListNavigationService';

interface OrganizerEventDetailPageProps {
  serviceFactory?: OrganizerEventDetailServiceFactory;
  startListNavigationFactory?: StartListNavigationServiceFactory;
}

function resolveService(
  factory: OrganizerEventDetailServiceFactory,
  eventId: string
): OrganizerEventDetailServiceState {
  const options: UseOrganizerEventDetailServiceOptions = { eventId };
  return factory(options);
}

function resolveStartListNavigationService(
  factory: StartListNavigationServiceFactory,
  eventId: string
): StartListNavigationServiceState {
  return factory({ eventId });
}

const OrganizerEventDetailPage = ({
  serviceFactory = useOrganizerEventDetailService,
  startListNavigationFactory = useStartListNavigationService
}: OrganizerEventDetailPageProps) => {
  const { eventId = '' } = useParams<'eventId'>();
  const { detail, loading, error, retry, publishing, publishError, publish } =
    resolveService(serviceFactory, eventId);
  const {
    navigating,
    navigationError,
    navigateToCreate,
    navigateToManagement
  } = resolveStartListNavigationService(startListNavigationFactory, eventId);
  const headingId = 'organizer-event-detail-heading';

  return (
    <main aria-labelledby={headingId}>
      <Link to="/events">イベント一覧に戻る</Link>
      <h1 id={headingId}>イベント詳細</h1>
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
              <dt>公開状態</dt>
              <dd>{detail.isPublic ? '公開済み' : '非公開'}</dd>
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
      {!loading && !error && detail && (
        <section aria-label="操作ボタン">
          <h2>操作</h2>
          {!detail.isPublic && (
            <div>
              <button type="button" onClick={publish} disabled={publishing}>
                {publishing ? '公開処理中...' : 'イベントを公開'}
              </button>
            </div>
          )}
          {detail.isPublic && <p>このイベントは公開済みです。</p>}
          {publishError && (
            <p role="alert">{publishError}</p>
          )}
          <div>
            {detail.entryReceptionStatus === 'NOT_REGISTERED' ? (
              <Link to={`/events/${detail.eventId}/entry-receptions/create`}>
                エントリー受付を作成
              </Link>
            ) : (
              <Link to={`/events/${detail.eventId}/entry-receptions`}>
                エントリー受付を管理
              </Link>
            )}
          </div>
          <div>
            {detail.startListStatus === 'NOT_CREATED' ? (
              <button type="button" onClick={navigateToCreate} disabled={navigating}>
                {navigating ? '遷移中...' : 'スタートリストを作成'}
              </button>
            ) : (
              <button type="button" onClick={navigateToManagement} disabled={navigating}>
                {navigating ? '遷移中...' : 'スタートリストを管理'}
              </button>
            )}
          </div>
          {navigationError && <p role="alert">{navigationError}</p>}
          <div>
            {detail.resultPublicationStatus === 'NOT_PUBLISHED' ? (
              <button type="button">リザルトを公開</button>
            ) : (
              <button type="button">公開済みリザルトを見る</button>
            )}
          </div>
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

export default OrganizerEventDetailPage;
