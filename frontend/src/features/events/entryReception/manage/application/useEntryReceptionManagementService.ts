import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EventApiError,
  fetchEntryReceptionPreparation,
  fetchEntryReceptionParticipants,
  type EntryReceptionPreparationResponse,
  type EntryReceptionParticipantsResponse
} from '../../../api/eventApi';

export interface EntryReceptionManagementGateway {
  fetchEntryReceptionPreparation: (
    eventId: string,
    signal?: AbortSignal
  ) => Promise<EntryReceptionPreparationResponse>;
  fetchEntryReceptionParticipants: (
    eventId: string,
    signal?: AbortSignal
  ) => Promise<EntryReceptionParticipantsResponse>;
}

export interface UseEntryReceptionManagementServiceOptions {
  eventId: string;
  eventName?: string;
  gateway?: EntryReceptionManagementGateway;
}

export type EntryReceptionManagementTabId = 'SETTINGS' | 'PARTICIPANTS';

export interface EntryReceptionManagementTabViewModel {
  id: EntryReceptionManagementTabId;
  label: string;
  isActive: boolean;
}

export interface EntryReceptionManagementSettingsRaceViewModel {
  raceId: string;
  label: string;
  receptionPeriodLabel: string;
  entryClassSummaries: Array<{ classId: string; label: string }>;
}

export interface EntryReceptionManagementSettingsPanelViewModel {
  races: EntryReceptionManagementSettingsRaceViewModel[];
  emptyMessage: string;
  editButtonLabel: string;
}

export interface EntryReceptionManagementParticipantsPanelViewModel {
  isEmpty: boolean;
  totalParticipantsLabel: string;
  races: EntryReceptionManagementParticipantsRaceViewModel[];
  emptyMessage: string;
  description: string;
}

export interface EntryReceptionManagementParticipantsRaceViewModel {
  raceId: string;
  label: string;
  participantCountLabel: string;
  classes: EntryReceptionManagementParticipantsClassViewModel[];
}

export interface EntryReceptionManagementParticipantsClassViewModel {
  classId: string;
  label: string;
  participantCountLabel: string;
  emptyMessage: string;
  participants: EntryReceptionManagementParticipantsListItemViewModel[];
}

export interface EntryReceptionManagementParticipantsListItemViewModel {
  entryId: string;
  name: string;
  email: string;
  submittedAtLabel: string;
}

export interface EntryReceptionManagementViewModel {
  heading: string;
  statusLabel: string;
  statusDescription: string;
  tabs: EntryReceptionManagementTabViewModel[];
  activeTabId: EntryReceptionManagementTabId;
  selectTab: (tabId: EntryReceptionManagementTabId) => void;
  settingsPanel: EntryReceptionManagementSettingsPanelViewModel;
  participantsPanel: EntryReceptionManagementParticipantsPanelViewModel;
}

export interface EntryReceptionManagementServiceState {
  loading: boolean;
  error: string | null;
  retry: () => void;
  viewModel: EntryReceptionManagementViewModel | null;
}

export type EntryReceptionManagementServiceFactory = (
  options: UseEntryReceptionManagementServiceOptions
) => EntryReceptionManagementServiceState;

const FALLBACK_ERROR_MESSAGE = 'エントリー受付情報の取得に失敗しました。';

function translateEntryReceptionStatus(status: EntryReceptionPreparationResponse['entryReceptionStatus']): {
  label: string;
  description: string;
} {
  switch (status) {
    case 'OPEN':
      return {
        label: '受付中',
        description: '参加者からのエントリーを受け付けています。'
      };
    case 'CLOSED':
      return {
        label: '受付終了',
        description: 'エントリー受付は終了しました。設定を変更する場合は編集してください。'
      };
    default:
      return {
        label: '未登録',
        description: 'エントリー受付はまだ設定されていません。設定を完了してください。'
      };
  }
}

function toSettingsPanelViewModel(
  preparation: EntryReceptionPreparationResponse
): EntryReceptionManagementSettingsPanelViewModel {
  const races = preparation.raceReceptions.map((race, index) => ({
    raceId: race.raceId,
    label: `レース${index + 1}（ID: ${race.raceId}）`,
    receptionPeriodLabel: `受付期間: ${race.receptionStart} 〜 ${race.receptionEnd}`,
    entryClassSummaries: race.entryClasses.map((entryClass) => ({
      classId: entryClass.classId,
      label:
        entryClass.capacity !== undefined
          ? `${entryClass.name}（定員 ${entryClass.capacity}名）`
          : `${entryClass.name}（定員未設定）`
    }))
  }));

  return {
    races,
    emptyMessage: '受付設定がまだ登録されていません。',
    editButtonLabel: '受付設定を編集'
  };
}

function formatClassLabel(name: string, capacity?: number): string {
  if (capacity !== undefined) {
    return `${name}（定員 ${capacity}名）`;
  }

  return `${name}（定員未設定）`;
}

function createParticipantsPanelViewModel(
  participants: EntryReceptionParticipantsResponse
): EntryReceptionManagementParticipantsPanelViewModel {
  const races: EntryReceptionManagementParticipantsRaceViewModel[] = participants.races.map(
    (race, index) => ({
      raceId: race.raceId,
      label: `レース${index + 1}（ID: ${race.raceId}）`,
      participantCountLabel: `参加者数: ${race.participantCount}名`,
      classes: race.entryClasses.map((entryClass) => ({
        classId: entryClass.classId,
        label: formatClassLabel(entryClass.className, entryClass.capacity),
        participantCountLabel: `参加者数: ${entryClass.participantCount}名`,
        emptyMessage: 'このクラスの参加者はまだいません。',
        participants: entryClass.participants.map((participant) => ({
          entryId: participant.entryId,
          name: participant.name,
          email: participant.email,
          submittedAtLabel: participant.submittedAt
        }))
      }))
    })
  );

  return {
    isEmpty: participants.totalParticipants === 0,
    totalParticipantsLabel: `総参加者数: ${participants.totalParticipants}名`,
    races,
    emptyMessage: '参加者はまだ登録されていません。',
    description: '各レース・クラスごとの最新のエントリー状況を確認できます。'
  };
}

export const useEntryReceptionManagementService: EntryReceptionManagementServiceFactory = (
  options
) => {
  const gateway = useMemo<EntryReceptionManagementGateway>(
    () => ({
      fetchEntryReceptionPreparation:
        options.gateway?.fetchEntryReceptionPreparation ?? fetchEntryReceptionPreparation,
      fetchEntryReceptionParticipants:
        options.gateway?.fetchEntryReceptionParticipants ?? fetchEntryReceptionParticipants
    }),
    [options.gateway?.fetchEntryReceptionParticipants, options.gateway?.fetchEntryReceptionPreparation]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preparation, setPreparation] =
    useState<EntryReceptionPreparationResponse | null>(null);
  const [participants, setParticipants] =
    useState<EntryReceptionParticipantsResponse | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [activeTab, setActiveTab] = useState<EntryReceptionManagementTabId>('SETTINGS');

  const retry = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const selectTab = useCallback((tabId: EntryReceptionManagementTabId) => {
    setActiveTab(tabId);
  }, []);

  useEffect(() => {
    if (!options.eventId || options.eventId.trim().length === 0) {
      setLoading(false);
      setError('イベントIDが指定されていません。');
      setPreparation(null);
      setParticipants(null);
      return;
    }

    const abortController = new AbortController();
    let mounted = true;

    setLoading(true);
    setError(null);

    Promise.all([
      gateway.fetchEntryReceptionPreparation(options.eventId, abortController.signal),
      gateway.fetchEntryReceptionParticipants(options.eventId, abortController.signal)
    ])
      .then(([preparationResponse, participantResponse]) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        setPreparation(preparationResponse);
        setParticipants(participantResponse);
      })
      .catch((caughtError) => {
        if (!mounted || abortController.signal.aborted) {
          return;
        }
        const message =
          caughtError instanceof EventApiError
            ? caughtError.message
            : FALLBACK_ERROR_MESSAGE;
        setError(message);
        setPreparation(null);
        setParticipants(null);
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
  }, [gateway, options.eventId, refreshToken]);

  useEffect(() => {
    setActiveTab('SETTINGS');
  }, [preparation?.eventId]);

  const viewModel = useMemo<EntryReceptionManagementViewModel | null>(() => {
    if (!preparation || !participants) {
      return null;
    }

    const displayName = (() => {
      const trimmed = options.eventName?.trim();
      if (trimmed && trimmed.length > 0) {
        return trimmed;
      }
      return preparation.eventId;
    })();

    const status = translateEntryReceptionStatus(preparation.entryReceptionStatus);
    const tabs: EntryReceptionManagementTabViewModel[] = [
      { id: 'SETTINGS', label: '受付設定', isActive: activeTab === 'SETTINGS' },
      { id: 'PARTICIPANTS', label: '参加者', isActive: activeTab === 'PARTICIPANTS' }
    ];

    return {
      heading: `${displayName} エントリー受付管理`,
      statusLabel: status.label,
      statusDescription: status.description,
      tabs,
      activeTabId: activeTab,
      selectTab,
      settingsPanel: toSettingsPanelViewModel(preparation),
      participantsPanel: createParticipantsPanelViewModel(participants)
    };
  }, [activeTab, options.eventName, participants, preparation, selectTab]);

  return {
    loading,
    error,
    retry,
    viewModel
  };
};

export default useEntryReceptionManagementService;
