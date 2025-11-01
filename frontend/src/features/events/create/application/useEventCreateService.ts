import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldErrors, UseFieldArrayReturn, UseFormRegister, UseFormReturn, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EventApiError,
  EventCreationDefaultsResponse,
  CreateEventResponseDto,
  fetchEventCreationDefaults,
  postCreateEvent
} from '../../api/eventApi';
import { EventCreateFormValues, eventCreateSchema } from '../types';
import type { CreateEventRequest } from '@shared/event/contracts/CreateEventContract';

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

export interface EventCreateServiceGateway {
  fetchDefaults: (signal?: AbortSignal) => Promise<EventCreationDefaultsResponse>;
  createEvent: (dto: CreateEventRequest, signal?: AbortSignal) => Promise<CreateEventResponseDto>;
}

export interface UseEventCreateServiceOptions {
  onSuccess?: () => void;
  gateway?: EventCreateServiceGateway;
}

type SubmitHandlerFn = ReturnType<UseFormReturn<EventCreateFormValues>['handleSubmit']>;
type RaceFieldArray = UseFieldArrayReturn<EventCreateFormValues, 'raceSchedules'>['fields'];

export interface EventCreateServiceState {
  register: UseFormRegister<EventCreateFormValues>;
  errors: FieldErrors<EventCreateFormValues>;
  isSubmitting: boolean;
  loading: boolean;
  loadError: string | null;
  submitError: string | null;
  defaults: EventCreationDefaultsResponse;
  races: RaceFieldArray;
  isMultiDay: boolean;
  isMultiRace: boolean;
  endDate?: string;
  canAddMoreRaces: boolean;
  minRaceCount: number;
  onSubmit: SubmitHandlerFn;
  onToggleMultiDay: (checked: boolean) => void;
  onToggleMultiRace: (checked: boolean) => void;
  onChangeEndDate: (value: string) => void;
  onAddRace: () => void;
  onRemoveRace: (index: number) => void;
  resetSubmitError: () => void;
}

function mapToRequest(values: EventCreateFormValues): CreateEventRequest {
  return {
    eventId: values.eventId,
    eventName: values.eventName,
    startDate: values.startDate,
    endDate: values.endDate?.trim() || undefined,
    raceSchedules: values.raceSchedules.map((race) => ({
      name: race.name,
      date: race.date
    }))
  };
}

function formatSubmitError(error: unknown): string {
  if (error instanceof EventApiError) {
    return error.message;
  }

  return 'イベント作成に失敗しました。';
}

export const useEventCreateService = (
  options?: UseEventCreateServiceOptions
): EventCreateServiceState => {
  const gateway: EventCreateServiceGateway = useMemo(
    () => ({
      fetchDefaults: options?.gateway?.fetchDefaults ?? fetchEventCreationDefaults,
      createEvent: options?.gateway?.createEvent ?? postCreateEvent
    }),
    [options?.gateway?.createEvent, options?.gateway?.fetchDefaults]
  );

  const onSuccessRef = useRef<(() => void) | undefined>(options?.onSuccess);
  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);

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
    let mounted = true;

    setLoading(true);
    setLoadError(null);

    gateway
      .fetchDefaults(abortController.signal)
      .then((response) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setDefaults(response);
        defaultsInitializedRef.current = false;
      })
      .catch((error) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setLoadError('イベント作成初期設定の取得に失敗しました。');
      })
      .finally(() => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [gateway]);

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
    if (isMultiDay || !startDate) {
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

  const maxRaceCount = useMemo(
    () => Math.max(defaults.minRaceSchedules, defaults.maxRaceSchedules),
    [defaults.maxRaceSchedules, defaults.minRaceSchedules]
  );

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

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await gateway.createEvent(mapToRequest(values));
      onSuccessRef.current?.();
    } catch (error) {
      setSubmitError(formatSubmitError(error));
    }
  });

  const canAddMoreRaces = useMemo(
    () => isMultiRace && fields.length < maxRaceCount,
    [fields.length, isMultiRace, maxRaceCount]
  );

  return {
    register,
    errors,
    isSubmitting,
    loading,
    loadError,
    submitError,
    defaults,
    races: fields,
    isMultiDay,
    isMultiRace,
    endDate: endDate ?? undefined,
    canAddMoreRaces,
    minRaceCount: defaults.minRaceSchedules,
    onSubmit,
    onToggleMultiDay: handleToggleMultiDay,
    onToggleMultiRace: handleToggleMultiRace,
    onChangeEndDate: handleChangeEndDate,
    onAddRace: handleAddRace,
    onRemoveRace: handleRemoveRace,
    resetSubmitError: () => setSubmitError(null)
  };
};

export type EventCreateServiceFactory = (
  options: UseEventCreateServiceOptions
) => EventCreateServiceState;

