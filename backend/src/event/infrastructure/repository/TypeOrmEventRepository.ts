import { DataSource, EntityManager } from 'typeorm';

import EventRepository from '../../application/port/out/EventRepository';
import Event from '../../domain/Event';
import { mapEventToEntity, EventEntity } from './EventEntity';
import { mapRaceScheduleToEntity, RaceScheduleEntity } from './RaceScheduleEntity';

class EventPersistenceError extends Error {
  public constructor(message: string, public readonly cause: unknown) {
    super(message);
    this.name = 'EventPersistenceError';
  }
}

function wrapPersistenceError(message: string, error: unknown): never {
  if (error instanceof EventPersistenceError) {
    throw error;
  }

  throw new EventPersistenceError(message, error);
}

/**
 * TypeORMベースのイベント永続化アダプター。
 * 集約全体の保存処理をトランザクションとして扱い、
 * 変換責務はエンティティ層に委譲する。
 */
export class TypeOrmEventRepository implements EventRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async save(event: Event): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {

      const eventRecord = mapEventToEntity(event);

      try {
        await manager.save(EventEntity, eventRecord);
      } catch (error: unknown) {
        wrapPersistenceError('イベント情報の保存に失敗しました。', error);
      }

      const raceRecords = event.raceSchedules.map((schedule) =>
        mapRaceScheduleToEntity(event.eventIdentifier, schedule)
      );

      for (const raceRecord of raceRecords) {
        try {
          await manager.save(RaceScheduleEntity, raceRecord);
        } catch (error: unknown) {
          wrapPersistenceError('レース日程の保存に失敗しました。', error);
        }
      }
    });
  }
}

export default TypeOrmEventRepository;
