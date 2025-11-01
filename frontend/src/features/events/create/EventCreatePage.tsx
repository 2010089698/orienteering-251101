import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import EventBasicSection from './EventBasicSection';
import MultiDaySection from './MultiDaySection';
import RaceListSection from './RaceListSection';
import { EventCreateFormValues, eventCreateSchema } from './types';
import {
  CreateEventRequestDto,
  EventApiError,
  EventCreationDefaultsResponse,
  fetchEventCreationDefaults,
  postCreateEvent
} from '../api/eventApi';

const DEFAULT_FORM_VALUES: EventCreateFormValues = {
  eventId: '',
  eventName: '',
  startDate: '',
  endDate: '',
  isMultiDay: false,
  isMultiRace: false,
  raceSchedules: [{ name: '', date: '' }]
};

const DEFAULT_EVENT_LIMITS: EventCreationDefaultsResponse = {
  dateFormat: 'YYYY-MM-DD',
  timezone: 'UTC',
  minRaceSchedules: 1,
  maxRaceSchedules: 10,
  requireEndDateForMultipleRaces: true
};

const EventCreatePage = () => {
  const navigate = useNavigate();
  const [defaults, setDefaults] = useState<EventCreationDefaultsResponse>(DEFAULT_EVENT_LIMITS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const defaultsInitializedRef = useRef(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<EventCreateFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
    resolver: zodResolver(eventCreateSchema),
    mode: 'onChange'
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'raceSchedules'
  });

  const isMultiDay = watch('isMultiDay');
  const isMultiRace = watch('isMultiRace');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    const abortController = new AbortController();

    fetchEventCreationDefaults(abortController.signal)
      .then((response) => {
        setDefaults(response);
        defaultsInitializedRef.current = false;
      })
      .catch(() => {
        setLoadError('イベント作成初期設定の取得に失敗しました。');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (defaultsInitializedRef.current) {
      return;
    }

    const minRaces = Math.max(1, defaults.minRaceSchedules);
    if (fields.length < minRaces) {
      const currentStartDate = getValues('startDate');
      const newRaces = Array.from({ length: minRaces - fields.length }, () => ({
        name: '',
        date: isMultiDay ? '' : currentStartDate
      }));
      newRaces.forEach((race) => append(race));
    }

    defaultsInitializedRef.current = true;
  }, [append, defaults.minRaceSchedules, fields.length, getValues, isMultiDay]);

  useEffect(() => {
    if (!isMultiRace && fields.length > defaults.minRaceSchedules) {
      const currentValues = getValues('raceSchedules');
      replace(currentValues.slice(0, defaults.minRaceSchedules));
    }
  }, [defaults.minRaceSchedules, fields.length, getValues, isMultiRace, replace]);

  useEffect(() => {
    if (!isMultiDay) {
      setValue('endDate', '', { shouldDirty: true });
    }
  }, [isMultiDay, setValue]);

  useEffect(() => {
    if (isMultiDay) {
      return;
    }

    if (!startDate) {
      return;
    }

    fields.forEach((field, index) => {
      const currentDate = getValues(`raceSchedules.${index}.date` as const);
      if (!currentDate) {
        setValue(`raceSchedules.${index}.date` as const, startDate, {
          shouldDirty: false,
          shouldValidate: false
        });
      }
    });
  }, [fields, getValues, isMultiDay, setValue, startDate]);

  const maxRaceCount = useMemo(() => Math.max(defaults.minRaceSchedules, defaults.maxRaceSchedules), [
    defaults.maxRaceSchedules,
    defaults.minRaceSchedules
  ]);

  const handleToggleMultiDay = useCallback(
    (checked: boolean) => {
      setValue('isMultiDay', checked, { shouldDirty: true });
    },
    [setValue]
  );

  const handleToggleMultiRace = useCallback(
    (checked: boolean) => {
      setValue('isMultiRace', checked, { shouldDirty: true });
    },
    [setValue]
  );

  const handleChangeEndDate = useCallback(
    (value: string) => {
      setValue('endDate', value, { shouldDirty: true });
    },
    [setValue]
  );

  const handleAddRace = useCallback(() => {
    if (fields.length >= maxRaceCount) {
      return;
    }

    append({ name: '', date: isMultiDay ? '' : startDate });
  }, [append, fields.length, isMultiDay, maxRaceCount, startDate]);

  const handleRemoveRace = useCallback(
    (index: number) => {
      if (fields.length <= defaults.minRaceSchedules) {
        return;
      }
      remove(index);
    },
    [defaults.minRaceSchedules, fields.length, remove]
  );

  const mapToRequest = (values: EventCreateFormValues): CreateEventRequestDto => ({
    eventId: values.eventId,
    eventName: values.eventName,
    startDate: values.startDate,
    endDate: values.endDate?.trim() || undefined,
    raceSchedules: values.raceSchedules.map((race) => ({
      name: race.name,
      date: race.date
    }))
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await postCreateEvent(mapToRequest(values));
      navigate('/events');
    } catch (error) {
      if (error instanceof EventApiError) {
        setSubmitError(error.message);
        return;
      }
      setSubmitError('イベント作成に失敗しました。');
    }
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
        onToggleMultiDay={handleToggleMultiDay}
        onToggleMultiRace={handleToggleMultiRace}
        onEndDateChange={handleChangeEndDate}
        disabled={isSubmitting}
      />
      <RaceListSection
        register={register}
        races={fields}
        errors={errors}
        onAddRace={handleAddRace}
        onRemoveRace={handleRemoveRace}
        canAddMore={isMultiRace && fields.length < maxRaceCount}
        minRaceCount={defaults.minRaceSchedules}
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
