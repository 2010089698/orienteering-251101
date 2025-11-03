import PublicEventListQueryRepository from '../../port/out/PublicEventListQueryRepository';
import EventSummaryResponseDto from '../EventSummaryResponseDto';
import ListPublicEventsQuery from './ListPublicEventsQuery';

export class ListPublicEventsQueryHandler {
  public constructor(
    private readonly publicEventListQueryRepository: PublicEventListQueryRepository
  ) {}

  public async execute(
    query: ListPublicEventsQuery
  ): Promise<ReadonlyArray<EventSummaryResponseDto>> {
    const summaries = await this.publicEventListQueryRepository.findPublicSummaries(query.condition);
    return [...summaries];
  }
}

export default ListPublicEventsQueryHandler;
