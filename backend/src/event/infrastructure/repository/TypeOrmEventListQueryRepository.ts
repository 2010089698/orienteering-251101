import { DataSource } from 'typeorm';

import EventListQueryRepository from '../../application/port/out/EventListQueryRepository';
import EventSummaryResponseDto from '../../application/query/EventSummaryResponseDto';
import { EventEntity } from './EventEntity';
import { mapEventEntityToSummary } from './mappers/EventSummaryMapper';

export class TypeOrmEventListQueryRepository implements EventListQueryRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async findSummariesByOrganizerId(
    organizerId: string
  ): Promise<ReadonlyArray<EventSummaryResponseDto>> {
    const repository = this.dataSource.getRepository(EventEntity);

    const events = await repository
      .createQueryBuilder('event')
      .where('event.organizer_id = :organizerId', { organizerId })
      .orderBy('event.start_date', 'ASC')
      .getMany();

    return events.map((event) => mapEventEntityToSummary(event));
  }
}

export default TypeOrmEventListQueryRepository;
