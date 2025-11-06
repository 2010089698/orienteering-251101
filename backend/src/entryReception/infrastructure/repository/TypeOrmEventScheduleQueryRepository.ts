import { DataSource } from 'typeorm';

import EventScheduleQueryRepository, {
  EventScheduleDetail,
  RaceScheduleSummary
} from '../../application/port/out/EventScheduleQueryRepository';
import { EventEntity } from '../../../event/infrastructure/repository/EventEntity';
import { RaceScheduleEntity } from '../../../event/infrastructure/repository/RaceScheduleEntity';

export class TypeOrmEventScheduleQueryRepository implements EventScheduleQueryRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async findByEventId(eventId: string): Promise<EventScheduleDetail | null> {
    const repository = this.dataSource.getRepository(EventEntity);
    const event = await repository.findOne({
      where: { id: eventId },
      relations: { raceSchedules: true }
    });

    if (!event) {
      return null;
    }

    const raceSchedules: RaceScheduleSummary[] = (event.raceSchedules ?? []).map(
      (raceSchedule: RaceScheduleEntity): RaceScheduleSummary => ({
        id: raceSchedule.name,
        scheduledDate: raceSchedule.scheduledDate
      })
    );

    return {
      id: event.id,
      startDate: event.startDate,
      endDate: event.endDate,
      raceSchedules
    } satisfies EventScheduleDetail;
  }
}

export default TypeOrmEventScheduleQueryRepository;
