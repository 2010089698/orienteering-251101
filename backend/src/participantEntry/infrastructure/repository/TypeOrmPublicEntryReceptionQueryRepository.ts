import { DataSource } from 'typeorm';

import PublicEntryReceptionQueryRepository from '../../application/port/out/PublicEntryReceptionQueryRepository';
import EntryReceptionSummary from '../../domain/service/EntryReceptionSummary';
import EntryReceptionEntity from '../../../entryReception/infrastructure/repository/EntryReceptionEntity';

export class TypeOrmPublicEntryReceptionQueryRepository
  implements PublicEntryReceptionQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findForRace(
    eventId: string,
    raceId: string
  ): Promise<EntryReceptionSummary | null> {
    const repository = this.dataSource.getRepository(EntryReceptionEntity);
    const reception = await repository.findOne({
      where: { eventId, raceId },
      relations: { entryClasses: true },
    });

    if (!reception) {
      return null;
    }

    return {
      eventId: reception.eventId,
      raceId: reception.raceId,
      receptionWindow: {
        opensAt: new Date(reception.receptionStart.getTime()),
        closesAt: new Date(reception.receptionEnd.getTime()),
      },
      entryClasses: (reception.entryClasses ?? []).map((entryClass) => ({
        id: entryClass.classId,
        name: entryClass.name,
      })),
    } satisfies EntryReceptionSummary;
  }
}

export default TypeOrmPublicEntryReceptionQueryRepository;
