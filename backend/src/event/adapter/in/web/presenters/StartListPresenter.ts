import StartListDraftResponseDto from '../../../../../startList/application/query/StartListDraftResponseDto';

export interface StartListSettingsViewModel {
  readonly startDateTime: string;
  readonly intervalSeconds: number;
  readonly laneCount: number;
}

export interface StartListLaneAssignmentViewModel {
  readonly laneNumber: number;
  readonly entryClassId: string;
}

export interface StartListParticipantSlotViewModel {
  readonly laneNumber: number;
  readonly entryClassId: string;
  readonly participantEntryId: string;
  readonly participantName: string;
  readonly startTime: string;
  readonly sequence: number;
}

export interface StartListDraftViewModel {
  readonly eventId: string;
  readonly raceId: string;
  readonly status: 'DRAFT' | 'PUBLISHED';
  readonly settings: StartListSettingsViewModel;
  readonly lanes: ReadonlyArray<StartListLaneAssignmentViewModel>;
  readonly participants: ReadonlyArray<StartListParticipantSlotViewModel>;
}

export function presentStartListDraft(
  draft: StartListDraftResponseDto
): StartListDraftViewModel {
  return {
    eventId: draft.eventId,
    raceId: draft.raceId,
    status: draft.status,
    settings: {
      startDateTime: draft.settings.startDateTime.toISOString(),
      intervalSeconds: draft.settings.intervalSeconds,
      laneCount: draft.settings.laneCount,
    },
    lanes: draft.lanes.map((lane) => ({
      laneNumber: lane.laneNumber,
      entryClassId: lane.entryClassId,
    })),
    participants: draft.participants.map((slot) => ({
      laneNumber: slot.laneNumber,
      entryClassId: slot.entryClassId,
      participantEntryId: slot.participantEntryId,
      participantName: slot.participantName,
      startTime: slot.startTime.toISOString(),
      sequence: slot.sequence,
    })),
  } satisfies StartListDraftViewModel;
}

export default presentStartListDraft;
