import Event from '../../domain/Event';
import RaceSchedule from '../../domain/RaceSchedule';
import EventRepository from '../../application/port/out/EventRepository';

export interface EntityManagerLike {
  save<T>(entity: T): Promise<T>;
}

export interface DataSourceLike {
  transaction<T>(work: (manager: EntityManagerLike) => Promise<T>): Promise<T>;
}

class EventEntity {
  public id!: string;
  public name!: string;
  public startDate!: Date;
  public endDate!: Date;
  public isMultiDay!: boolean;
  public isMultiRace!: boolean;

  public static from(event: Event): EventEntity {
    const entity = new EventEntity();
    entity.id = event.eventIdentifier;
    entity.name = event.displayName;
    entity.startDate = event.eventDuration.startDate;
    entity.endDate = event.eventDuration.endDate;
    entity.isMultiDay = event.isMultiDayEvent;
    entity.isMultiRace = event.isMultiRaceEvent;
    return entity;
  }
}

class RaceScheduleEntity {
  public eventId!: string;
  public name!: string;
  public scheduledDate!: Date;

  public static from(eventId: string, schedule: RaceSchedule): RaceScheduleEntity {
    const entity = new RaceScheduleEntity();
    entity.eventId = eventId;
    entity.name = schedule.name;
    entity.scheduledDate = schedule.date;
    return entity;
  }
}

/**
 * TypeORM互換のデータソースを想定した永続化アダプター。
 * トランザクション境界はデータソースに委譲する。
 */
export class TypeOrmEventRepository implements EventRepository {
  constructor(private readonly dataSource: DataSourceLike) {}

  public async save(event: Event): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const eventRecord = EventEntity.from(event);
      await manager.save(eventRecord);

      const raceRecords = event.raceSchedules.map((schedule) =>
        RaceScheduleEntity.from(event.eventIdentifier, schedule)
      );

      for (const raceRecord of raceRecords) {
        await manager.save(raceRecord);
      }
    });
  }
}

export default TypeOrmEventRepository;
