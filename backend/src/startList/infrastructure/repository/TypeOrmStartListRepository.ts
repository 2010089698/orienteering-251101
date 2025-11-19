import { DataSource } from 'typeorm';

import StartListDraft from '../../domain/StartListDraft';
import StartListRepository from '../../application/port/out/StartListRepository';
import StartListDraftEntity, {
  mapDraftToEntity,
  mapEntityToDraft,
} from './StartListDraftEntity';

class TypeOrmStartListRepository implements StartListRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async save(draft: StartListDraft): Promise<void> {
    const repository = this.dataSource.getRepository(StartListDraftEntity);
    const entity = mapDraftToEntity(draft);
    await repository.save(entity);
  }

  public async findByEventAndRace(
    eventId: string,
    raceId: string
  ): Promise<StartListDraft | null> {
    const repository = this.dataSource.getRepository(StartListDraftEntity);
    const entity = await repository.findOne({ where: { eventId, raceId } });
    if (!entity) {
      return null;
    }
    return mapEntityToDraft(entity);
  }
}

export default TypeOrmStartListRepository;
