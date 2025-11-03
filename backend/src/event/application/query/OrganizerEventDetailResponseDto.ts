export interface RaceScheduleDetailDto {
  readonly name: string;
  readonly scheduledDate: Date;
}

interface OrganizerEventDetailResponseDto {
  readonly id: string;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly isMultiDay: boolean;
  readonly isMultiRace: boolean;
  readonly raceSchedules: ReadonlyArray<RaceScheduleDetailDto>;
  readonly isPublic: boolean;
  readonly entryReceptionStatus: 'NOT_REGISTERED' | 'OPEN' | 'CLOSED';
  readonly startListStatus: 'NOT_CREATED' | 'DRAFT' | 'PUBLISHED';
  readonly resultPublicationStatus: 'NOT_PUBLISHED' | 'PUBLISHED';
}

export default OrganizerEventDetailResponseDto;
