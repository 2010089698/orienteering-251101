import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  EventApiError,
  ParticipantEntrySelectionResponseDto,
  ParticipantEntrySubmissionResponseDto,
  RegisterParticipantEntryRequestDto,
  fetchParticipantEntryOptions,
  fetchPublicEventDetail,
  submitParticipantEntry
} from '../../../api/eventApi';
import type { PublicEventDetailResponse } from '@shared/event/contracts/PublicEventDetailContract';

const FALLBACK_LOAD_ERROR = '参加者エントリー情報の取得に失敗しました。';
const FALLBACK_OPTIONS_ERROR = 'エントリークラス情報の取得に失敗しました。';
const FALLBACK_SUBMIT_ERROR = 'エントリーの送信に失敗しました。';

const participantEntryFormSchema = z.object({
  raceId: z.string().min(1, 'レースを選択してください。'),
  classId: z.string().min(1, 'クラスを選択してください。'),
  participant: z.object({
    name: z.string().min(1, '参加者氏名を入力してください。'),
    organization: z.string().optional(),
    cardNumber: z.string().optional()
  })
});

export type ParticipantEntryCreateFormValues = z.infer<typeof participantEntryFormSchema>;

const DEFAULT_FORM_VALUES: ParticipantEntryCreateFormValues = {
  raceId: '',
  classId: '',
  participant: {
    name: '',
    organization: '',
    cardNumber: ''
  }
};

export interface ParticipantEntryRaceViewModel {
  raceId: string;
  raceName: string;
  raceDate: string;
  isSelectable: boolean;
  isSelected: boolean;
  isLoading: boolean;
  error: string | null;
  assistanceText: string | null;
}

export interface ParticipantEntryClassViewModel {
  classId: string;
  name: string;
  capacityLabel: string | null;
}

interface ParticipantEntryRaceState {
  raceId: string;
  raceName: string;
  raceDate: string;
  status: 'idle' | 'loading' | 'ready';
  isSelectable: boolean;
  assistanceText: string | null;
  errorMessage: string | null;
  classes: ParticipantEntryClassViewModel[] | null;
}

export interface ParticipantEntryCreateGateway {
  fetchEventDetail: (eventId: string, signal?: AbortSignal) => Promise<PublicEventDetailResponse>;
  fetchRaceOptions: (
    eventId: string,
    raceId: string,
    signal?: AbortSignal
  ) => Promise<ParticipantEntrySelectionResponseDto>;
  submitEntry: (
    eventId: string,
    request: RegisterParticipantEntryRequestDto,
    signal?: AbortSignal
  ) => Promise<ParticipantEntrySubmissionResponseDto>;
}

export interface UseParticipantEntryCreateServiceOptions {
  eventId: string;
  gateway?: ParticipantEntryCreateGateway;
  onSuccess?: () => void;
}

export interface ParticipantEntryCreateServiceState {
  register: ReturnType<typeof useForm<ParticipantEntryCreateFormValues>>['register'];
  formState: ReturnType<typeof useForm<ParticipantEntryCreateFormValues>>['formState'];
  races: ParticipantEntryRaceViewModel[];
  classes: ParticipantEntryClassViewModel[];
  eventName: string;
  loading: boolean;
  loadError: string | null;
  optionsError: string | null;
  submitError: string | null;
  isSubmitting: boolean;
  onSelectRace: (raceId: string) => void;
  onSubmit: SubmitHandler;
  retry: () => void;
  resetSubmitError: () => void;
}

export type ParticipantEntryCreateServiceFactory = (
  options: UseParticipantEntryCreateServiceOptions
) => ParticipantEntryCreateServiceState;

type SubmitHandler = ReturnType<UseFormReturn<ParticipantEntryCreateFormValues>['handleSubmit']>;

function mapToRequest(
  eventId: string,
  values: ParticipantEntryCreateFormValues
): RegisterParticipantEntryRequestDto {
  return {
    eventId,
    raceId: values.raceId,
    classId: values.classId,
    participant: {
      name: values.participant.name,
      organization: normalizeOptional(values.participant.organization),
      cardNumber: normalizeOptional(values.participant.cardNumber)
    }
  };
}

function normalizeOptional(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function createRaceStates(
  detail: PublicEventDetailResponse
): ParticipantEntryRaceState[] {
  const isEventReceptionOpen = detail.entryReceptionStatus === 'OPEN';
  const closedMessage = isEventReceptionOpen ? null : 'エントリー受付は現在利用できません。';

  return detail.raceSchedules.map((race) => ({
    raceId: race.name,
    raceName: race.name,
    raceDate: race.date,
    status: 'idle',
    isSelectable: isEventReceptionOpen,
    assistanceText: closedMessage,
    errorMessage: null,
    classes: null
  }));
}

function toRaceViewModel(
  states: ParticipantEntryRaceState[],
  selectedRaceId: string
): ParticipantEntryRaceViewModel[] {
  return states.map((state) => ({
    raceId: state.raceId,
    raceName: state.raceName,
    raceDate: state.raceDate,
    isSelectable: state.isSelectable,
    isSelected: state.raceId === selectedRaceId,
    isLoading: state.status === 'loading',
    error: state.errorMessage,
    assistanceText: state.errorMessage ? null : state.assistanceText
  }));
}

function extractRaceClasses(
  response: ParticipantEntrySelectionResponseDto,
  raceId: string
): ParticipantEntryClassViewModel[] {
  const race = response.races.find((item) => item.raceId === raceId);

  if (!race) {
    return [];
  }

  return race.entryClasses.map((entryClass) => ({
    classId: entryClass.classId,
    name: entryClass.name,
    capacityLabel: entryClass.capacity != null ? `定員: ${entryClass.capacity}名` : null
  }));
}

export const useParticipantEntryCreateService: ParticipantEntryCreateServiceFactory = (
  options
) => {
  const gateway = useMemo<ParticipantEntryCreateGateway>(
    () => ({
      fetchEventDetail: options.gateway?.fetchEventDetail ?? fetchPublicEventDetail,
      fetchRaceOptions: options.gateway?.fetchRaceOptions ?? fetchParticipantEntryOptions,
      submitEntry: options.gateway?.submitEntry ?? submitParticipantEntry
    }),
    [options.gateway?.fetchEventDetail, options.gateway?.fetchRaceOptions, options.gateway?.submitEntry]
  );

  const form = useForm<ParticipantEntryCreateFormValues>({
    resolver: zodResolver(participantEntryFormSchema),
    defaultValues: DEFAULT_FORM_VALUES
  });
  const { register, handleSubmit, formState, setValue, getValues } = form;

  const [eventName, setEventName] = useState('');
  const [raceStates, setRaceStates] = useState<ParticipantEntryRaceState[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const optionsAbortControllerRef = useRef<AbortController | null>(null);
  const submitAbortControllerRef = useRef<AbortController | null>(null);

  const resetSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const retry = useCallback(() => {
    setRefreshToken((token) => token + 1);
    setOptionsError(null);
  }, []);

  useEffect(() => {
    if (!options.eventId || options.eventId.trim().length === 0) {
      setEventName('');
      setRaceStates([]);
      setSelectedRaceId('');
      setLoading(false);
      setLoadError('イベントIDが指定されていません。');
      return;
    }

    const abortController = new AbortController();
    let mounted = true;

    setLoading(true);
    setLoadError(null);

    gateway
      .fetchEventDetail(options.eventId, abortController.signal)
      .then((detail) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }

        setEventName(detail.eventName);
        const states = createRaceStates(detail);
        setRaceStates(states);

        if (detail.entryReceptionStatus === 'OPEN' && states.length > 0) {
          const initialRaceId = states[0].raceId;
          setSelectedRaceId(initialRaceId);
          setValue('raceId', initialRaceId, { shouldValidate: true });
        } else {
          setSelectedRaceId('');
          setValue('raceId', '', { shouldValidate: true });
        }
      })
      .catch((error) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }

        const message = error instanceof EventApiError ? error.message : FALLBACK_LOAD_ERROR;
        setLoadError(message);
        setRaceStates([]);
        setSelectedRaceId('');
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
  }, [gateway, options.eventId, refreshToken, setValue]);

  const loadRaceOptions = useCallback(
    (raceId: string) => {
      if (!options.eventId || options.eventId.trim().length === 0) {
        return;
      }

      const targetRace = raceStates.find((race) => race.raceId === raceId);

      if (!targetRace) {
        return;
      }

      if (!targetRace.isSelectable) {
        setOptionsError(targetRace.assistanceText);
        return;
      }

      setOptionsError(null);
      setRaceStates((prev) =>
        prev.map((race) =>
          race.raceId === raceId
            ? {
                ...race,
                status: 'loading',
                errorMessage: null,
                classes: null
              }
            : race
        )
      );

      if (optionsAbortControllerRef.current) {
        optionsAbortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      optionsAbortControllerRef.current = abortController;

      gateway
        .fetchRaceOptions(options.eventId, raceId, abortController.signal)
        .then((response) => {
          if (abortController.signal.aborted) {
            return;
          }

          const classes = extractRaceClasses(response, raceId);

          setRaceStates((prev) =>
            prev.map((race) => {
              if (race.raceId !== raceId) {
                return race;
              }

              return {
                ...race,
                status: 'ready',
                errorMessage: null,
                classes
              };
            })
          );

          if (classes.length > 0) {
            setValue('classId', classes[0].classId, { shouldValidate: true });
          } else {
            setValue('classId', '', { shouldValidate: true });
          }
        })
        .catch((error) => {
          if (abortController.signal.aborted) {
            return;
          }

          const message = error instanceof EventApiError ? error.message : FALLBACK_OPTIONS_ERROR;
          const isUnavailable =
            error instanceof EventApiError && (error.status === 404 || error.status === 410);
          setOptionsError(message);
          setRaceStates((prev) =>
            prev.map((race) => {
              if (race.raceId !== raceId) {
                return race;
              }

              if (isUnavailable) {
                return {
                  ...race,
                  status: 'idle',
                  isSelectable: false,
                  assistanceText: message,
                  errorMessage: null,
                  classes: []
                };
              }

              return {
                ...race,
                status: 'idle',
                errorMessage: message,
                classes: []
              };
            })
          );
          setValue('classId', '', { shouldValidate: true });
        })
        .finally(() => {
          if (optionsAbortControllerRef.current === abortController) {
            optionsAbortControllerRef.current = null;
          }
        });
    },
    [gateway, options.eventId, raceStates, setValue]
  );

  useEffect(() => {
    if (!selectedRaceId) {
      return;
    }

    const targetRace = raceStates.find((race) => race.raceId === selectedRaceId);

    if (!targetRace) {
      return;
    }

    if (!targetRace.isSelectable) {
      setOptionsError(targetRace.assistanceText);
      return;
    }

    if (targetRace.errorMessage) {
      setOptionsError(targetRace.errorMessage);
      return;
    }

    setOptionsError(null);

    if (targetRace.status === 'idle') {
      loadRaceOptions(selectedRaceId);
      return;
    }

    if (targetRace.status === 'ready' && targetRace.classes && targetRace.classes.length > 0) {
      const currentValue = getValues('classId');
      if (!currentValue) {
        setValue('classId', targetRace.classes[0].classId, { shouldValidate: true });
      }
    }
  }, [getValues, loadRaceOptions, raceStates, selectedRaceId, setValue]);

  const onSelectRace = useCallback(
    (raceId: string) => {
      setSelectedRaceId(raceId);
      setValue('raceId', raceId, { shouldValidate: true });
      setValue('classId', '', { shouldValidate: true });
      const race = raceStates.find((item) => item.raceId === raceId);
      if (!race) {
        loadRaceOptions(raceId);
        return;
      }

      if (!race.isSelectable) {
        setOptionsError(race.assistanceText);
        return;
      }

      if (race.errorMessage) {
        setOptionsError(race.errorMessage);
      } else {
        setOptionsError(null);
      }

      if (race.status !== 'ready') {
        loadRaceOptions(raceId);
      }
    },
    [loadRaceOptions, raceStates, setValue]
  );

  const classes = useMemo(() => {
    const race = raceStates.find((item) => item.raceId === selectedRaceId);

    if (!race || race.status !== 'ready' || !race.classes) {
      return [];
    }

    return race.classes;
  }, [raceStates, selectedRaceId]);

  const races = useMemo(
    () => toRaceViewModel(raceStates, selectedRaceId),
    [raceStates, selectedRaceId]
  );

  const submitHandler = useMemo<SubmitHandler>(
    () =>
      handleSubmit((values) => {
        if (!options.eventId || options.eventId.trim().length === 0) {
          setSubmitError('イベントIDが指定されていません。');
          return Promise.resolve();
        }

        setSubmitError(null);

        if (submitAbortControllerRef.current) {
          submitAbortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        submitAbortControllerRef.current = abortController;

        const request = mapToRequest(options.eventId, values);

        return gateway
          .submitEntry(options.eventId, request, abortController.signal)
          .then(() => {
            options.onSuccess?.();
          })
          .catch((error) => {
            const message = error instanceof EventApiError ? error.message : FALLBACK_SUBMIT_ERROR;
            setSubmitError(message);
          })
          .finally(() => {
            if (submitAbortControllerRef.current === abortController) {
              submitAbortControllerRef.current = null;
            }
          });
      }),
    [gateway, handleSubmit, options.eventId, options.onSuccess]
  );

  useEffect(
    () => () => {
      optionsAbortControllerRef.current?.abort();
      submitAbortControllerRef.current?.abort();
    },
    []
  );

  return {
    register,
    formState,
    races,
    classes,
    eventName,
    loading,
    loadError,
    optionsError,
    submitError,
    isSubmitting: formState.isSubmitting,
    onSelectRace,
    onSubmit: submitHandler,
    retry,
    resetSubmitError
  };
};

export default useParticipantEntryCreateService;
