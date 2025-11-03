import EventSummaryResponseDto from '../../query/EventSummaryResponseDto';
import PublicEventSearchCondition from '../../query/participant/PublicEventSearchCondition';

export interface PublicEventListQueryRepository {
  findPublicSummaries(
    condition: PublicEventSearchCondition
  ): Promise<ReadonlyArray<EventSummaryResponseDto>>;
}

export default PublicEventListQueryRepository;
