import { FormEventHandler, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  EntryReceptionCreateServiceFactory,
  EntryReceptionCreateServiceState,
  UseEntryReceptionCreateServiceOptions,
  useEntryReceptionCreateService
} from './application/useEntryReceptionCreateService';

interface EntryReceptionCreatePageProps {
  serviceFactory?: EntryReceptionCreateServiceFactory;
}

function resolveService(
  factory: EntryReceptionCreateServiceFactory,
  options: UseEntryReceptionCreateServiceOptions
): EntryReceptionCreateServiceState {
  return factory(options);
}

const EntryReceptionCreatePage = ({
  serviceFactory = useEntryReceptionCreateService
}: EntryReceptionCreatePageProps) => {
  const { eventId = '' } = useParams<'eventId'>();
  const navigate = useNavigate();

  const service = resolveService(serviceFactory, {
    eventId,
    onSuccess: () => navigate(`/events/${eventId}`)
  });

  const {
    register,
    errors,
    isSubmitting,
    loading,
    loadError,
    submitError,
    eventName,
    receptions,
    getClassesByRace,
    onAddClass,
    onRemoveClass,
    onSubmit,
    reload,
    resetSubmitError
  } = service;

  const handleCancel = useCallback(() => {
    navigate(`/events/${eventId}`);
  }, [eventId, navigate]);

  const handleChange: FormEventHandler<HTMLFormElement> = useCallback(
    () => {
      if (submitError) {
        resetSubmitError();
      }
    },
    [resetSubmitError, submitError]
  );

  const headingId = 'entry-reception-create-heading';

  return (
    <main aria-labelledby={headingId}>
      <Link to={`/events/${eventId}`}>イベント詳細に戻る</Link>
      <h1 id={headingId}>エントリー受付設定</h1>
      {eventName && <p aria-live="polite">対象イベント: {eventName}</p>}
      {loading && (
        <p role="status" aria-live="polite">
          読み込み中...
        </p>
      )}
      {!loading && loadError && (
        <div>
          <p role="alert">{loadError}</p>
          <button type="button" onClick={reload}>
            再読み込み
          </button>
        </div>
      )}
      {!loading && !loadError && (
        <form onChange={handleChange} onSubmit={onSubmit} aria-describedby={submitError ? 'entry-reception-error' : undefined}>
          {receptions.length === 0 ? (
            <p>設定可能なレースがありません。</p>
          ) : (
            receptions.map((race, raceIndex) => {
              const raceError = errors.receptions?.[raceIndex];
              const classes = getClassesByRace(race.raceId);
              return (
                <section key={race.id} aria-label={`${race.raceName}の受付設定`}>
                  <h2>{race.raceName}</h2>
                  <div>
                    <label>
                      受付開始
                      <input
                        type="datetime-local"
                        {...register(`receptions.${raceIndex}.opensAt` as const)}
                      />
                    </label>
                    {raceError?.opensAt && <p role="alert">{raceError.opensAt.message}</p>}
                  </div>
                  <div>
                    <label>
                      受付終了
                      <input
                        type="datetime-local"
                        {...register(`receptions.${raceIndex}.closesAt` as const)}
                      />
                    </label>
                    {raceError?.closesAt && <p role="alert">{raceError.closesAt.message}</p>}
                  </div>
                  <div>
                    <h3>クラス設定</h3>
                    {classes.length === 0 ? (
                      <p>登録されたクラスはありません。</p>
                    ) : (
                      <ul>
                        {classes.map(({ index, field }) => {
                          const classError = errors.classes?.[index];
                          return (
                            <li key={field.id}>
                              <label>
                                クラス名
                                <input
                                  type="text"
                                  {...register(`classes.${index}.name` as const)}
                                />
                              </label>
                              {classError?.name && <p role="alert">{classError.name.message}</p>}
                              <label>
                                定員
                                <input
                                  type="number"
                                  min={0}
                                  {...register(`classes.${index}.capacity` as const)}
                                />
                              </label>
                              {classError?.capacity && <p role="alert">{classError.capacity.message}</p>}
                              <button type="button" onClick={() => onRemoveClass(index)}>
                                クラスを削除
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <button type="button" onClick={() => onAddClass(race.raceId)}>
                      クラスを追加
                    </button>
                  </div>
                </section>
              );
            })
          )}
          {submitError && (
            <p id="entry-reception-error" role="alert">
              {submitError}
            </p>
          )}
          <div>
            <button type="submit" disabled={isSubmitting || receptions.length === 0}>
              {isSubmitting ? '登録処理中...' : '登録完了'}
            </button>
            <button type="button" onClick={handleCancel}>
              やめる
            </button>
          </div>
        </form>
      )}
    </main>
  );
};

export default EntryReceptionCreatePage;

