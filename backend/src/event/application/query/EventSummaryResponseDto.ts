export interface EventSummaryResponseDto {
  readonly id: string;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isMultiDay: boolean;
  readonly isMultiRace: boolean;
}

export default EventSummaryResponseDto;
