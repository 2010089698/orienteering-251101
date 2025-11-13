import { Link, useLocation, useParams } from 'react-router-dom';
import type {
  EntryReceptionManagementServiceFactory,
  EntryReceptionManagementServiceState
} from './application/useEntryReceptionManagementService';
import { useEntryReceptionManagementService } from './application/useEntryReceptionManagementService';

interface EntryReceptionManagementPageProps {
  serviceFactory?: EntryReceptionManagementServiceFactory;
}

interface EntryReceptionManagementLocationState {
  eventName?: string;
}

function resolveService(
  factory: EntryReceptionManagementServiceFactory,
  eventId: string,
  eventName?: string
): EntryReceptionManagementServiceState {
  return factory({ eventId, eventName });
}

const EntryReceptionManagementPage = ({
  serviceFactory = useEntryReceptionManagementService
}: EntryReceptionManagementPageProps) => {
  const { eventId = '' } = useParams<'eventId'>();
  const location = useLocation();
  const locationState = location.state as EntryReceptionManagementLocationState | null;
  const eventName = locationState?.eventName;
  const { loading, error, retry, viewModel } = resolveService(
    serviceFactory,
    eventId,
    eventName
  );
  const headingId = 'entry-reception-management-heading';

  return (
    <main aria-labelledby={headingId} aria-live="polite">
      <Link to={`/events/${eventId}`}>イベント詳細に戻る</Link>
      <h1 id={headingId}>{viewModel?.heading ?? 'エントリー受付管理'}</h1>
      {loading && (
        <p role="status">読み込み中...</p>
      )}
      {!loading && error && (
        <div role="alert" aria-live="assertive">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            再試行
          </button>
        </div>
      )}
      {!loading && !error && viewModel && (
        <>
          <section aria-labelledby="entry-reception-status-heading">
            <h2 id="entry-reception-status-heading">受付状態</h2>
            <p>
              <strong>{viewModel.statusLabel}</strong>
            </p>
            <p>{viewModel.statusDescription}</p>
          </section>
          <nav aria-label="エントリー受付の管理タブ">
            <ul role="tablist">
              {viewModel.tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    role="tab"
                    id={`${tab.id}-tab`}
                    aria-selected={tab.isActive}
                    aria-controls={`${tab.id}-panel`}
                    onClick={() => viewModel.selectTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <section
            id="SETTINGS-panel"
            role="tabpanel"
            aria-labelledby="SETTINGS-tab"
            hidden={viewModel.activeTabId !== 'SETTINGS'}
          >
            <h2>受付設定</h2>
            {viewModel.settingsPanel.races.length === 0 ? (
              <p>{viewModel.settingsPanel.emptyMessage}</p>
            ) : (
              <ul>
                {viewModel.settingsPanel.races.map((race) => (
                  <li key={race.raceId}>
                    <p>{race.label}</p>
                    <p>{race.receptionPeriodLabel}</p>
                    {race.entryClassSummaries.length > 0 && (
                      <ul>
                        {race.entryClassSummaries.map((summary) => (
                          <li key={summary.classId}>{summary.label}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button type="button">{viewModel.settingsPanel.editButtonLabel}</button>
          </section>
          <section
            id="PARTICIPANTS-panel"
            role="tabpanel"
            aria-labelledby="PARTICIPANTS-tab"
            hidden={viewModel.activeTabId !== 'PARTICIPANTS'}
          >
            <h2>参加者</h2>
            <p>{viewModel.participantsPanel.emptyMessage}</p>
            <p>{viewModel.participantsPanel.description}</p>
          </section>
        </>
      )}
    </main>
  );
};

export default EntryReceptionManagementPage;
