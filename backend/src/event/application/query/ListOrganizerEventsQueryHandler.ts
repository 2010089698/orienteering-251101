import EventListQueryRepository from '../port/out/EventListQueryRepository';
import EventSummaryResponseDto from './EventSummaryResponseDto';
import ListOrganizerEventsQuery from './ListOrganizerEventsQuery';

export class ListOrganizerEventsQueryHandler {
  public constructor(
    private readonly eventListQueryRepository: EventListQueryRepository
  ) {}

  public async execute(
    query: ListOrganizerEventsQuery
  ): Promise<ReadonlyArray<EventSummaryResponseDto>> {
    const summaries = await this.eventListQueryRepository.findSummariesByOrganizerId(
      query.organizerId
    );
    return [...summaries];
  }
}

export default ListOrganizerEventsQueryHandler;
