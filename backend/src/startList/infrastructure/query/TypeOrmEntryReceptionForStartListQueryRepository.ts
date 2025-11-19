import { DataSource } from 'typeorm';

import EntryReceptionClassEntity from '../../../entryReception/infrastructure/repository/EntryReceptionClassEntity';
import EntryReceptionForStartListQuery, {
  EntryClassSummaryDto,
} from '../../application/port/out/EntryReceptionForStartListQuery';

class TypeOrmEntryReceptionForStartListQueryRepository
  implements EntryReceptionForStartListQuery
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findEntryClasses(
    eventId: string,
    raceId: string
  ): Promise<ReadonlyArray<EntryClassSummaryDto>> {
    const repository = this.dataSource.getRepository(EntryReceptionClassEntity);
    const classes = await repository.find({
      where: { eventId, raceId },
      order: { classId: 'ASC' },
    });

    return classes.map((entryClass) => ({
      classId: entryClass.classId,
      name: entryClass.name,
    }));
  }
}

export default TypeOrmEntryReceptionForStartListQueryRepository;
