import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  type ParticipantEntryCreateServiceFactory,
  useParticipantEntryCreateService
} from './application/useParticipantEntryCreateService';

interface ParticipantEntryCreatePageProps {
  serviceFactory?: ParticipantEntryCreateServiceFactory;
}

const ParticipantEntryCreatePage = ({
  serviceFactory = useParticipantEntryCreateService
}: ParticipantEntryCreatePageProps) => {
  const { eventId = '' } = useParams<'eventId'>();
  const navigate = useNavigate();

  const {
    register,
    formState,
    races,
    classes,
    eventName,
    loading,
    loadError,
    optionsError,
    submitError,
    isSubmitting,
    onSelectRace,
    onSubmit,
    retry,
    resetSubmitError
  } = serviceFactory({
    eventId,
    onSuccess: () => {
      navigate(`/public/events/${eventId}`);
    }
  });

  const raceError = formState.errors.raceId?.message;
  const classError = formState.errors.classId?.message;
  const participantErrors = formState.errors.participant;

  const participantNameError = participantErrors?.name?.message;
  const participantEmailError = participantErrors?.email?.message;
  const participantOrganizationError = participantErrors?.organization?.message;
  const participantCardNumberError = participantErrors?.cardNumber?.message;

  const raceFieldRegistration = register('raceId');
  const classFieldRegistration = register('classId');
  const participantNameRegistration = register('participant.name');
  const participantEmailRegistration = register('participant.email');
  const participantOrganizationRegistration = register('participant.organization');
  const participantCardNumberRegistration = register('participant.cardNumber');

  const classesEmptyMessage = useMemo(() => {
    if (classes.length > 0) {
      return null;
    }

    if (optionsError) {
      return optionsError;
    }

    if (races.length === 0) {
      return 'エントリー可能なレースがありません。';
    }

    return '選択可能なクラスがありません。';
  }, [classes.length, optionsError, races.length]);

  const headingId = 'participant-entry-create-heading';

  return (
    <main aria-labelledby={headingId}>
      <Link to={`/public/events/${eventId}`}>イベント詳細に戻る</Link>
      <h1 id={headingId}>参加者エントリー</h1>
      {loading && (
        <p role="status" aria-live="polite">
          読み込み中...
        </p>
      )}
      {!loading && loadError && (
        <div role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={retry}>
            再読み込み
          </button>
        </div>
      )}
      {!loading && !loadError && (
        <form
          aria-describedby={submitError ? 'participant-entry-submit-error' : undefined}
          onSubmit={onSubmit}
        >
          <section aria-label="イベント情報">
            <h2>{eventName || 'イベント情報'}</h2>
          </section>
          <section aria-label="レース選択">
            <h2>レースを選択</h2>
            {races.length === 0 ? (
              <p>エントリー対象のレースがありません。</p>
            ) : (
              <fieldset>
                <legend>レース一覧</legend>
                {races.map((race) => {
                  const raceId = `participant-entry-race-${race.raceId}`;

                  const describedByIds: string[] = [];

                  if (race.isLoading) {
                    describedByIds.push(`${raceId}-status`);
                  }

                  if (race.error) {
                    describedByIds.push(`${raceId}-error`);
                  } else if (race.assistanceText) {
                    describedByIds.push(`${raceId}-note`);
                  }

                  if (raceError) {
                    describedByIds.push('participant-entry-race-error');
                  }

                  const ariaDescribedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

                  return (
                    <div key={race.raceId}>
                      <div>
                        <input
                          {...raceFieldRegistration}
                          id={raceId}
                          type="radio"
                          value={race.raceId}
                          onChange={(event) => {
                            resetSubmitError();
                            raceFieldRegistration.onChange(event);
                            onSelectRace(event.target.value);
                          }}
                          disabled={!race.isSelectable || isSubmitting}
                          aria-describedby={ariaDescribedBy}
                        />
                        <label htmlFor={raceId}>
                          {race.raceName}（{race.raceDate}）
                        </label>
                      </div>
                      {race.isLoading && (
                        <p id={`${raceId}-status`} role="status" aria-live="polite">
                          クラス情報を読み込み中...
                        </p>
                      )}
                      {race.error && (
                        <p id={`${raceId}-error`} role="alert">
                          {race.error}
                        </p>
                      )}
                      {!race.error && race.assistanceText && (
                        <p id={`${raceId}-note`} role="note">
                          {race.assistanceText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            )}
            {raceError && (
              <p role="alert" id="participant-entry-race-error">
                {raceError}
              </p>
            )}
          </section>
          <section aria-label="クラス選択">
            <h2>クラスを選択</h2>
            <label htmlFor="participant-entry-class">エントリークラス</label>
            <select
              id="participant-entry-class"
              {...classFieldRegistration}
              onChange={(event) => {
                resetSubmitError();
                classFieldRegistration.onChange(event);
              }}
              disabled={isSubmitting || classes.length === 0}
            >
              <option value="">クラスを選択してください</option>
              {classes.map((entryClass) => (
                <option key={entryClass.classId} value={entryClass.classId}>
                  {entryClass.name}
                  {entryClass.capacityLabel ? `（${entryClass.capacityLabel}）` : ''}
                </option>
              ))}
            </select>
            {classError && (
              <p role="alert" id="participant-entry-class-error">
                {classError}
              </p>
            )}
            {classesEmptyMessage && (
              <p role="note" aria-live="polite">
                {classesEmptyMessage}
              </p>
            )}
          </section>
          <section aria-label="参加者情報">
            <h2>参加者情報</h2>
            <div>
              <label htmlFor="participant-entry-name">氏名</label>
              <input
                id="participant-entry-name"
                type="text"
                {...participantNameRegistration}
                onChange={(event) => {
                  resetSubmitError();
                  participantNameRegistration.onChange(event);
                }}
                disabled={isSubmitting}
              />
              {participantNameError && (
                <p role="alert" id="participant-entry-name-error">
                  {participantNameError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="participant-entry-email">メールアドレス</label>
              <input
                id="participant-entry-email"
                type="email"
                {...participantEmailRegistration}
                onChange={(event) => {
                  resetSubmitError();
                  participantEmailRegistration.onChange(event);
                }}
                disabled={isSubmitting}
              />
              {participantEmailError && (
                <p role="alert" id="participant-entry-email-error">
                  {participantEmailError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="participant-entry-organization">所属</label>
              <input
                id="participant-entry-organization"
                type="text"
                {...participantOrganizationRegistration}
                onChange={(event) => {
                  resetSubmitError();
                  participantOrganizationRegistration.onChange(event);
                }}
                disabled={isSubmitting}
              />
              {participantOrganizationError && (
                <p role="alert" id="participant-entry-organization-error">
                  {participantOrganizationError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="participant-entry-card-number">カード番号</label>
              <input
                id="participant-entry-card-number"
                type="text"
                {...participantCardNumberRegistration}
                onChange={(event) => {
                  resetSubmitError();
                  participantCardNumberRegistration.onChange(event);
                }}
                disabled={isSubmitting}
              />
              {participantCardNumberError && (
                <p role="alert" id="participant-entry-card-number-error">
                  {participantCardNumberError}
                </p>
              )}
            </div>
          </section>
          {isSubmitting && (
            <p role="status" aria-live="polite">
              送信中...
            </p>
          )}
          {submitError && (
            <p role="alert" id="participant-entry-submit-error">
              {submitError}
            </p>
          )}
          <div>
            <button type="submit" disabled={isSubmitting}>
              送信
            </button>
            <button
              type="button"
              onClick={() => navigate(`/public/events/${eventId}`)}
              disabled={isSubmitting}
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </main>
  );
};

export default ParticipantEntryCreatePage;
