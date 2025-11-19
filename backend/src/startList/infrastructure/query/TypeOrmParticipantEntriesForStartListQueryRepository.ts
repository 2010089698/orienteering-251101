import { DataSource } from 'typeorm';

import ParticipantEntryEntity from '../../../participantEntry/infrastructure/repository/ParticipantEntryEntity';
import ParticipantEntriesForStartListQuery, {
  ParticipantForStartListDto,
} from '../../application/port/out/ParticipantEntriesForStartListQuery';

class TypeOrmParticipantEntriesForStartListQueryRepository
  implements ParticipantEntriesForStartListQuery
{
  public constructor(private readonly dataSource: DataSource) {}

  public async listByRace(
    eventId: string,
    raceId: string
  ): Promise<ReadonlyArray<ParticipantForStartListDto>> {
    const repository = this.dataSource.getRepository(ParticipantEntryEntity);
    const participants = await repository.find({
      where: { eventId, raceId },
      order: { submittedAt: 'ASC' },
    });

    return participants.map((participant) => ({
      entryId: participant.id,
      entryClassId: participant.entryClassId,
      participantName: participant.participantName,
      submittedAt: participant.submittedAt,
    }));
  }
}

export default TypeOrmParticipantEntriesForStartListQueryRepository;
