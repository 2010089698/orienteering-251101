export interface EventCreationDefaultsResponseDto {
  readonly dateFormat: string;
  readonly timezone: string;
  readonly minRaceSchedules: number;
  readonly maxRaceSchedules: number;
  readonly requireEndDateForMultipleRaces: boolean;
}

export default EventCreationDefaultsResponseDto;
