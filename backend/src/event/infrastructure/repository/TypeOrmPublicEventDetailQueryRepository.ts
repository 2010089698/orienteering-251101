import { DataSource } from 'typeorm';

import PublicEventDetailQueryRepository from '../../application/port/out/PublicEventDetailQueryRepository';
import PublicEventDetailResponseDto, {
  PublicRaceScheduleDetailDto
} from '../../application/query/participant/PublicEventDetailResponseDto';
import { EventEntity } from './EventEntity';

export class TypeOrmPublicEventDetailQueryRepository
  implements PublicEventDetailQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findDetailByEventId(
    eventId: string
  ): Promise<PublicEventDetailResponseDto | null> {
    const repository = this.dataSource.getRepository(EventEntity);

    const event = await repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.raceSchedules', 'raceSchedule')
      .where('event.id = :eventId', { eventId })
      .andWhere('event.is_public = :isPublic', { isPublic: true })
      .orderBy('raceSchedule.scheduled_date', 'ASC')
      .getOne();

    if (!event) {
      return null;
    }

    const raceSchedules: PublicRaceScheduleDetailDto[] = (event.raceSchedules ?? [])
      .map((schedule) => ({
        name: schedule.name,
        scheduledDate: schedule.scheduledDate
      }))
      .sort((left, right) => left.scheduledDate.getTime() - right.scheduledDate.getTime());

    return {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      isMultiDay: event.isMultiDay,
      isMultiRace: event.isMultiRace,
      raceSchedules,
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    } satisfies PublicEventDetailResponseDto;
  }
}

export default TypeOrmPublicEventDetailQueryRepository;
