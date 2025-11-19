import StartListDraft from '../../domain/StartListDraft';

export interface StartListSettingsDto {
  readonly startDateTime: Date;
  readonly intervalSeconds: number;
  readonly laneCount: number;
}

export interface StartListLaneAssignmentDto {
  readonly laneNumber: number;
  readonly entryClassId: string;
}

export interface StartListParticipantSlotDto {
  readonly laneNumber: number;
  readonly entryClassId: string;
  readonly participantEntryId: string;
  readonly participantName: string;
  readonly startTime: Date;
  readonly sequence: number;
}

export interface StartListDraftResponseDto {
  readonly eventId: string;
  readonly raceId: string;
  readonly status: 'DRAFT' | 'PUBLISHED';
  readonly settings: StartListSettingsDto;
  readonly lanes: ReadonlyArray<StartListLaneAssignmentDto>;
  readonly participants: ReadonlyArray<StartListParticipantSlotDto>;
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

export function toStartListDraftResponseDto(
  draft: StartListDraft
): StartListDraftResponseDto {
  const settings = draft.startListSettings;

  const lanes = [...draft.laneConfigurations]
    .sort((left, right) => left.laneNumber - right.laneNumber)
    .map((lane) => ({
      laneNumber: lane.laneNumber,
      entryClassId: lane.entryClassId,
    }));

  const participants = [...draft.participantAssignments]
    .sort((left, right) => left.sequence - right.sequence)
    .map((slot) => ({
      laneNumber: slot.laneNumber,
      entryClassId: slot.entryClassId,
      participantEntryId: slot.participantEntryId,
      participantName: slot.participantName,
      startTime: cloneDate(slot.startTime),
      sequence: slot.sequence,
    }));

  return {
    eventId: draft.eventIdentifier,
    raceId: draft.raceIdentifier,
    status: draft.status,
    settings: {
      startDateTime: cloneDate(settings.startTime),
      intervalSeconds: settings.intervalInSeconds,
      laneCount: settings.laneCount,
    },
    lanes,
    participants,
  } satisfies StartListDraftResponseDto;
}

export default StartListDraftResponseDto;
