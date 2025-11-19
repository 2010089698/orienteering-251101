export interface ParticipantForStartListDto {
  readonly entryId: string;
  readonly entryClassId: string;
  readonly participantName: string;
  readonly submittedAt: Date;
}

interface ParticipantEntriesForStartListQuery {
  listByRace(eventId: string, raceId: string): Promise<ReadonlyArray<ParticipantForStartListDto>>;
}

export type { ParticipantEntriesForStartListQuery };
export default ParticipantEntriesForStartListQuery;
