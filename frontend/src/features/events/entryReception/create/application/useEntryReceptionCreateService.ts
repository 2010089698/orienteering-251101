import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Control,
  FieldErrors,
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormReturn,
  useFieldArray,
  useForm
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  EventApiError,
  EntryReceptionCreateResponseDto,
  EntryReceptionCreationDefaultsResponse,
  EntryReceptionRaceDefaultsDto,
  RegisterEntryReceptionRequestDto,
  fetchEntryReceptionCreationDefaults,
  postEntryReception
} from '../../../api/eventApi';

const DEFAULT_DEFAULTS: EntryReceptionCreationDefaultsResponse = {
  eventId: '',
  eventName: '',
  eventEndDate: '',
  races: []
};

const classIdSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, 'クラスIDを入力してください。');

const classCapacitySchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length === 0 || /^\d+$/.test(value), '定員は0以上の整数で入力してください。');

const entryReceptionCreateSchema = z
  .object({
    receptions: z
      .array(
        z.object({
          raceId: z.string().min(1),
          raceName: z.string().min(1),
          opensAt: z.string().min(1, '受付開始日時を入力してください。'),
          closesAt: z.string().min(1, '受付終了日時を入力してください。')
        })
      )
      .min(1, '少なくとも1つのレースを設定してください。'),
    classes: z.array(
      z.object({
        raceId: z.string().min(1),
        classId: classIdSchema,
        name: z.string().min(1, 'クラス名を入力してください。'),
        capacity: classCapacitySchema
      })
    )
  })
  .superRefine((data, ctx) => {
    data.receptions.forEach((reception, index) => {
      if (reception.opensAt && reception.closesAt && reception.opensAt > reception.closesAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '受付終了日時は受付開始以降を指定してください。',
          path: ['receptions', index, 'closesAt']
        });
      }
    });
  });

export type EntryReceptionCreateFormValues = z.infer<typeof entryReceptionCreateSchema>;

const DEFAULT_FORM_VALUES: EntryReceptionCreateFormValues = {
  receptions: [],
  classes: []
};

export interface EntryReceptionClassViewModel {
  index: number;
  field: EntryReceptionCreateFormValues['classes'][number];
}

export interface EntryReceptionCreateServiceGateway {
  fetchDefaults: (
    eventId: string,
    signal?: AbortSignal
  ) => Promise<EntryReceptionCreationDefaultsResponse>;
  createEntryReception: (
    eventId: string,
    dto: RegisterEntryReceptionRequestDto,
    signal?: AbortSignal
  ) => Promise<EntryReceptionCreateResponseDto>;
}

export interface UseEntryReceptionCreateServiceOptions {
  eventId: string;
  onSuccess?: () => void;
  gateway?: EntryReceptionCreateServiceGateway;
}

type SubmitHandler = ReturnType<UseFormReturn<EntryReceptionCreateFormValues>['handleSubmit']>;

export interface EntryReceptionCreateServiceState {
  register: UseFormRegister<EntryReceptionCreateFormValues>;
  control: Control<EntryReceptionCreateFormValues>;
  errors: FieldErrors<EntryReceptionCreateFormValues>;
  isSubmitting: boolean;
  loading: boolean;
  loadError: string | null;
  submitError: string | null;
  eventName: string;
  eventEnd: string;
  receptions: UseFieldArrayReturn<EntryReceptionCreateFormValues, 'receptions'>['fields'];
  classes: UseFieldArrayReturn<EntryReceptionCreateFormValues, 'classes'>['fields'];
  getClassesByRace: (raceId: string) => EntryReceptionClassViewModel[];
  onAddClass: (raceId: string) => void;
  onRemoveClass: (classIndex: number) => void;
  onSubmit: SubmitHandler;
  reload: () => void;
  resetSubmitError: () => void;
}

function mapDefaultsToFormValues(
  defaults: EntryReceptionCreationDefaultsResponse
): EntryReceptionCreateFormValues {
  const raceEntries = defaults.races.map((race) => ({
    raceId: race.raceId,
    raceName: race.raceName,
    opensAt: race.defaultReceptionStart ?? '',
    closesAt: race.defaultReceptionEnd ?? ''
  }));

  const classEntries = defaults.races.flatMap((race) => {
    if (!race.classTemplates || race.classTemplates.length === 0) {
      return [createEmptyClassFormValue(race.raceId)];
    }

    return race.classTemplates.map((template) => ({
      raceId: race.raceId,
      classId: template.classId,
      name: template.name,
      capacity: template.capacity != null ? String(template.capacity) : ''
    }));
  });

  return {
    receptions: raceEntries,
    classes: classEntries
  };
}

function createEmptyClassFormValue(
  raceId: string
): EntryReceptionCreateFormValues['classes'][number] {
  return {
    raceId,
    classId: '',
    name: '',
    capacity: ''
  };
}

function buildRequests(values: EntryReceptionCreateFormValues): RegisterEntryReceptionRequestDto[] {
  const classesByRace = values.classes.reduce<
    Record<string, RegisterEntryReceptionRequestDto['entryClasses']>
  >((acc, current) => {
    const normalized: RegisterEntryReceptionRequestDto['entryClasses'][number] = {
      classId: current.classId.trim(),
      name: current.name,
      capacity: parseCapacity(current.capacity)
    };
    const key = current.raceId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(normalized);
    return acc;
  }, {});

  return values.receptions.map((race) => ({
    raceId: race.raceId,
    receptionStart: race.opensAt,
    receptionEnd: race.closesAt,
    entryClasses: classesByRace[race.raceId] ?? []
  }));
}

function parseCapacity(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function formatSubmitError(error: unknown): string {
  if (error instanceof EventApiError) {
    if (error.status === 422) {
      const message =
        typeof error.details === 'object' && error.details !== null && 'message' in error.details
          ? (error.details as { message?: string }).message
          : undefined;
      return message ?? error.message;
    }
    return 'エントリー受付の登録に失敗しました。';
  }

  return 'エントリー受付の登録に失敗しました。';
}

function normalizeDefaults(
  defaults?: EntryReceptionCreationDefaultsResponse | null
): EntryReceptionCreationDefaultsResponse {
  if (!defaults) {
    return DEFAULT_DEFAULTS;
  }

  return {
    eventId: defaults.eventId ?? '',
    eventName: defaults.eventName ?? '',
    eventEndDate: defaults.eventEndDate ?? '',
    races: Array.isArray(defaults.races)
      ? defaults.races.map((race): EntryReceptionRaceDefaultsDto => ({
          raceId: race.raceId,
          raceName: race.raceName,
          defaultReceptionStart: race.defaultReceptionStart ?? '',
          defaultReceptionEnd: race.defaultReceptionEnd ?? '',
          classTemplates: Array.isArray(race.classTemplates) ? race.classTemplates : []
        }))
      : []
  };
}

export const useEntryReceptionCreateService = (
  options: UseEntryReceptionCreateServiceOptions
): EntryReceptionCreateServiceState => {
  const gateway: EntryReceptionCreateServiceGateway = useMemo(
    () => ({
      fetchDefaults: options.gateway?.fetchDefaults ?? fetchEntryReceptionCreationDefaults,
      createEntryReception: options.gateway?.createEntryReception ?? postEntryReception
    }),
    [options.gateway?.createEntryReception, options.gateway?.fetchDefaults]
  );

  const onSuccessRef = useRef<(() => void) | undefined>(options.onSuccess);
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
  }, [options.onSuccess]);

  const [eventName, setEventName] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset
  } = useForm<EntryReceptionCreateFormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
    resolver: zodResolver(entryReceptionCreateSchema),
    mode: 'onChange'
  });

  const receptionsFieldArray = useFieldArray({
    control,
    name: 'receptions'
  });

  const classesFieldArray = useFieldArray({
    control,
    name: 'classes'
  });

  const loadDefaults = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await gateway.fetchDefaults(options.eventId, signal);
        if (signal?.aborted) {
          return;
        }

        const normalized = normalizeDefaults(response);
        const formValues = mapDefaultsToFormValues(normalized);
        setEventName(normalized.eventName);
        setEventEnd(normalized.eventEndDate);
        reset(formValues, { keepDefaultValues: false });
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        setEventName('');
        setEventEnd('');
        setLoadError('エントリー受付の初期設定取得に失敗しました。');
      } finally {
        if (signal?.aborted) {
          return;
        }
        setLoading(false);
      }
    },
    [gateway, options.eventId, reset]
  );

  useEffect(() => {
    const abortController = new AbortController();
    loadDefaults(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadDefaults]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    clearErrors('receptions');

    const eventEndTimestamp = eventEnd ? new Date(eventEnd).getTime() : NaN;
    const isEventEndDefined = Number.isFinite(eventEndTimestamp);
    if (isEventEndDefined) {
      let hasEventEndError = false;
      let firstErrorSet = false;

      values.receptions.forEach((reception, index) => {
        if (!reception.closesAt) {
          return;
        }

        const closesAtTimestamp = new Date(reception.closesAt).getTime();
        if (Number.isFinite(closesAtTimestamp) && closesAtTimestamp > eventEndTimestamp) {
          hasEventEndError = true;
          const fieldName: `receptions.${number}.closesAt` = `receptions.${index}.closesAt`;
          setError(fieldName, {
            type: 'validate',
            message: '受付終了日時はイベント終了日時以前を指定してください。'
          }, { shouldFocus: !firstErrorSet });
          firstErrorSet = true;
        }
      });

      if (hasEventEndError) {
        return;
      }
    }

    try {
      const requests = buildRequests(values);
      for (const request of requests) {
        await gateway.createEntryReception(options.eventId, request);
      }
      onSuccessRef.current?.();
    } catch (error) {
      setSubmitError(formatSubmitError(error));
    }
  });

  const getClassesByRace = useCallback(
    (raceId: string): EntryReceptionClassViewModel[] =>
      classesFieldArray.fields
        .map<EntryReceptionClassViewModel>((field, index) => ({
          index,
          field
        }))
        .filter(({ field }) => field.raceId === raceId),
    [classesFieldArray.fields]
  );

  const handleAddClass = useCallback(
    (raceId: string) => {
      classesFieldArray.append(createEmptyClassFormValue(raceId));
      setSubmitError(null);
    },
    [classesFieldArray]
  );

  const handleRemoveClass = useCallback(
    (classIndex: number) => {
      classesFieldArray.remove(classIndex);
      setSubmitError(null);
    },
    [classesFieldArray]
  );

  const reload = useCallback(() => {
    loadDefaults();
  }, [loadDefaults]);

  return {
    register,
    control,
    errors,
    isSubmitting,
    loading,
    loadError,
    submitError,
    eventName,
    eventEnd,
    receptions: receptionsFieldArray.fields,
    classes: classesFieldArray.fields,
    getClassesByRace,
    onAddClass: handleAddClass,
    onRemoveClass: handleRemoveClass,
    onSubmit,
    reload,
    resetSubmitError: () => setSubmitError(null)
  };
};

export type EntryReceptionCreateServiceFactory = (
  options: UseEntryReceptionCreateServiceOptions
) => EntryReceptionCreateServiceState;

