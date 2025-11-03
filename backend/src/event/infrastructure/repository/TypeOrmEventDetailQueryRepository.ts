import { DataSource } from 'typeorm';

import EventDetailQueryRepository from '../../application/port/out/EventDetailQueryRepository';
import OrganizerEventDetailResponseDto, {
  RaceScheduleDetailDto
} from '../../application/query/OrganizerEventDetailResponseDto';
import { EventEntity } from './EventEntity';

export class TypeOrmEventDetailQueryRepository implements EventDetailQueryRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async findDetailByEventId(
    eventId: string
  ): Promise<OrganizerEventDetailResponseDto | null> {
    const repository = this.dataSource.getRepository(EventEntity);

    const event = await repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.raceSchedules', 'raceSchedule')
      .where('event.id = :eventId', { eventId })
      .orderBy('raceSchedule.scheduled_date', 'ASC')
      .getOne();

    if (!event) {
      return null;
    }

    const raceSchedules: RaceScheduleDetailDto[] = (event.raceSchedules ?? [])
      .map((schedule) => ({
        name: schedule.name,
        scheduledDate: schedule.scheduledDate
      }))
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    return {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      isMultiDay: event.isMultiDay,
      isMultiRace: event.isMultiRace,
      isPublic: event.isPublic,
      raceSchedules,
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    } satisfies OrganizerEventDetailResponseDto;
  }
}

export default TypeOrmEventDetailQueryRepository;
