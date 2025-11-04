import { DataSource } from 'typeorm';

import EntryReception from '../../domain/EntryReception';
import EntryReceptionRepository from '../../application/port/out/EntryReceptionRepository';
import EntryReceptionEntity, {
  mapEntityToEntryReception,
  mapEntryReceptionToEntity,
} from './EntryReceptionEntity';

export class TypeOrmEntryReceptionRepository implements EntryReceptionRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async save(entryReception: EntryReception): Promise<void> {
    const entity = mapEntryReceptionToEntity(entryReception);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(EntryReceptionEntity);
      await repository.delete({
        eventId: entity.eventId,
        raceId: entity.raceId,
      });
      await repository.save(entity);
    });
  }

  public async findByEventId(eventId: string): Promise<ReadonlyArray<EntryReception>> {
    const repository = this.dataSource.getRepository(EntryReceptionEntity);
    const entities = await repository.find({
      where: { eventId },
      relations: { entryClasses: true },
      order: { raceId: 'ASC' },
    });

    return entities.map(mapEntityToEntryReception);
  }
}

export default TypeOrmEntryReceptionRepository;
