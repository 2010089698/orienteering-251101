import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import EventBasicSection from './EventBasicSection';
import MultiDaySection from './MultiDaySection';
import RaceListSection from './RaceListSection';
import {
  EventCreateServiceFactory,
  useEventCreateService
} from './application/useEventCreateService';

interface EventCreatePageProps {
  serviceFactory?: EventCreateServiceFactory;
}

const EventCreatePage = ({ serviceFactory = useEventCreateService }: EventCreatePageProps) => {
  const navigate = useNavigate();
  const {
    register,
    errors,
    isSubmitting,
    loading,
    loadError,
    submitError,
    defaults,
    races,
    isMultiDay,
    isMultiRace,
    endDate,
    canAddMoreRaces,
    minRaceCount,
    onSubmit,
    onToggleMultiDay,
    onToggleMultiRace,
    onChangeEndDate,
    onAddRace,
    onRemoveRace
  } = serviceFactory({
    onSuccess: () => navigate('/events')
  });

  const handleCancel = useCallback(() => {
    navigate('/events');
  }, [navigate]);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (loadError) {
    return (
      <div>
        <p role="alert">{loadError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          再読込
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="イベント作成フォーム">
      <EventBasicSection register={register} errors={errors} disabled={isSubmitting} />
      <MultiDaySection
        isMultiDay={isMultiDay}
        isMultiRace={isMultiRace}
        endDate={endDate ?? ''}
        endDateError={errors.endDate?.message}
        onToggleMultiDay={onToggleMultiDay}
        onToggleMultiRace={onToggleMultiRace}
        onEndDateChange={onChangeEndDate}
        disabled={isSubmitting}
      />
      <RaceListSection
        register={register}
        races={races}
        errors={errors}
        onAddRace={onAddRace}
        onRemoveRace={onRemoveRace}
        canAddMore={canAddMoreRaces}
        minRaceCount={minRaceCount}
        disabled={isSubmitting}
      />
      {submitError && <p role="alert">{submitError}</p>}
      <div>
        <button type="submit" disabled={isSubmitting}>
          保存
        </button>
        <button type="button" onClick={handleCancel} disabled={isSubmitting}>
          キャンセル
        </button>
      </div>
    </form>
  );
};

export default EventCreatePage;
