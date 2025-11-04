import { DataSource } from 'typeorm';

import EntryReceptionPreparationResponseDto from '../../application/query/EntryReceptionPreparationResponseDto';
import EntryReceptionPreparationQueryRepository from '../../application/query/port/out/EntryReceptionPreparationQueryRepository';
import EntryReceptionEntity, {
  assemblePreparationResponse,
} from './EntryReceptionEntity';
import { EventEntity } from '../../../event/infrastructure/repository/EventEntity';

export class TypeOrmEntryReceptionQueryRepository
  implements EntryReceptionPreparationQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findByEventId(
    eventId: string
  ): Promise<EntryReceptionPreparationResponseDto | null> {
    const eventRepository = this.dataSource.getRepository(EventEntity);
    const eventExists = await eventRepository.exist({ where: { id: eventId } });

    if (!eventExists) {
      return null;
    }

    const repository = this.dataSource.getRepository(EntryReceptionEntity);
    const entities = await repository.find({
      where: { eventId },
      relations: { entryClasses: true },
      order: { raceId: 'ASC' },
    });

    return assemblePreparationResponse(eventId, entities);
  }
}

export default TypeOrmEntryReceptionQueryRepository;
