import { Brackets, DataSource, SelectQueryBuilder } from 'typeorm';

import PublicEventListQueryRepository from '../../application/port/out/PublicEventListQueryRepository';
import EventSummaryResponseDto from '../../application/query/EventSummaryResponseDto';
import PublicEventSearchCondition, {
  PublicEventStatus
} from '../../application/query/participant/PublicEventSearchCondition';
import { EventEntity } from './EventEntity';
import { mapEventEntityToSummary } from './mappers/EventSummaryMapper';

function applyStatusFilters(
  queryBuilder: SelectQueryBuilder<EventEntity>,
  statuses: ReadonlySet<PublicEventStatus>,
  referenceDate: Date
): void {
  if (statuses.size === 0) {
    return;
  }

  queryBuilder.andWhere(
    new Brackets((statusQuery) => {
      let index = 0;
      for (const status of statuses) {
        switch (status) {
          case 'upcoming': {
            const param = `publicEventsUpcoming${index}`;
            statusQuery.orWhere(`event.start_date > :${param}`, {
              [param]: referenceDate
            });
            break;
          }
          case 'ongoing': {
            const startParam = `publicEventsOngoingStart${index}`;
            const endParam = `publicEventsOngoingEnd${index}`;
            statusQuery.orWhere(
              `(event.start_date <= :${startParam} AND event.end_date >= :${endParam})`,
              {
                [startParam]: referenceDate,
                [endParam]: referenceDate
              }
            );
            break;
          }
          case 'past': {
            const param = `publicEventsPast${index}`;
            statusQuery.orWhere(`event.end_date < :${param}`, {
              [param]: referenceDate
            });
            break;
          }
          default:
            break;
        }
        index += 1;
      }
    })
  );
}

export class TypeOrmPublicEventListQueryRepository
  implements PublicEventListQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findPublicSummaries(
    condition: PublicEventSearchCondition
  ): Promise<ReadonlyArray<EventSummaryResponseDto>> {
    const repository = this.dataSource.getRepository(EventEntity);
    const queryBuilder = repository
      .createQueryBuilder('event')
      .where('event.is_public = :isPublic', { isPublic: true });

    const startFrom = condition.startDateFrom;
    if (startFrom) {
      queryBuilder.andWhere('event.start_date >= :startFrom', { startFrom });
    }

    const startTo = condition.startDateTo;
    if (startTo) {
      queryBuilder.andWhere('event.start_date <= :startTo', { startTo });
    }

    applyStatusFilters(queryBuilder, condition.statuses, condition.referenceDate);

    const events = await queryBuilder
      .orderBy('event.start_date', 'ASC')
      .addOrderBy('event.end_date', 'ASC')
      .getMany();

    return events.map((event) => mapEventEntityToSummary(event));
  }
}

export default TypeOrmPublicEventListQueryRepository;
