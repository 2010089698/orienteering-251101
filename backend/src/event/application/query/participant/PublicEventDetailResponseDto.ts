export interface PublicRaceScheduleDetailDto {
  readonly name: string;
  readonly scheduledDate: Date;
}

interface PublicEventDetailResponseDto {
  readonly id: string;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly isMultiDay: boolean;
  readonly isMultiRace: boolean;
  readonly raceSchedules: ReadonlyArray<PublicRaceScheduleDetailDto>;
  readonly entryReceptionStatus: 'NOT_REGISTERED' | 'OPEN' | 'CLOSED';
  readonly startListStatus: 'NOT_CREATED' | 'DRAFT' | 'PUBLISHED';
  readonly resultPublicationStatus: 'NOT_PUBLISHED' | 'PUBLISHED';
}

export default PublicEventDetailResponseDto;
