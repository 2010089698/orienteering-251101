export interface ParticipantEntryListItemDto {
  readonly entryId: string;
  readonly name: string;
  readonly email: string;
  readonly submittedAt: Date;
}

export interface ParticipantEntryClassListDto {
  readonly classId: string;
  readonly className: string;
  readonly capacity?: number;
  readonly participantCount: number;
  readonly participants: ReadonlyArray<ParticipantEntryListItemDto>;
}

export interface ParticipantEntryRaceListDto {
  readonly raceId: string;
  readonly raceName: string;
  readonly participantCount: number;
  readonly entryClasses: ReadonlyArray<ParticipantEntryClassListDto>;
}

interface ParticipantEntriesResponseDto {
  readonly eventId: string;
  readonly eventName: string;
  readonly totalParticipants: number;
  readonly races: ReadonlyArray<ParticipantEntryRaceListDto>;
}

export default ParticipantEntriesResponseDto;
