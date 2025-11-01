import EventSummaryResponseDto from '../../query/EventSummaryResponseDto';

export interface EventListQueryRepository {
  findSummariesByOrganizerId(
    organizerId: string
  ): Promise<ReadonlyArray<EventSummaryResponseDto>>;
}

export default EventListQueryRepository;
