import { DataSource } from 'typeorm';

import ParticipantEntryRepository from '../../application/port/out/ParticipantEntryRepository';
import ParticipantEntry from '../../domain/ParticipantEntry';
import ParticipantEntryEntity, {
  mapParticipantEntryToEntity,
} from './ParticipantEntryEntity';

export class TypeOrmParticipantEntryRepository
  implements ParticipantEntryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async save(entry: ParticipantEntry): Promise<void> {
    const repository = this.dataSource.getRepository(ParticipantEntryEntity);
    const entity = mapParticipantEntryToEntity(entry);
    await repository.save(entity);
  }
}

export default TypeOrmParticipantEntryRepository;
