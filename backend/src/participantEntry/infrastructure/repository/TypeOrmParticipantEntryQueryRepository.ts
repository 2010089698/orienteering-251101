import { DataSource } from 'typeorm';

import ParticipantEntryQueryRepository from '../../application/port/out/ParticipantEntryQueryRepository';
import ParticipantEntriesResponseDto, {
  ParticipantEntryClassListDto,
  ParticipantEntryRaceListDto
} from '../../application/query/ParticipantEntriesResponseDto';
import ParticipantEntryEntity from './ParticipantEntryEntity';
import EntryReceptionEntity from '../../../entryReception/infrastructure/repository/EntryReceptionEntity';
import { EventEntity } from '../../../event/infrastructure/repository/EventEntity';

export class TypeOrmParticipantEntryQueryRepository
  implements ParticipantEntryQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async listByEventId(
    eventId: string
  ): Promise<ParticipantEntriesResponseDto | null> {
    const eventRepository = this.dataSource.getRepository(EventEntity);
    const event = await eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      return null;
    }

    const entryReceptionRepository = this.dataSource.getRepository(EntryReceptionEntity);
    const entryReceptions = await entryReceptionRepository.find({
      where: { eventId },
      relations: { entryClasses: true },
      order: { raceId: 'ASC' }
    });

    const participantsRepository = this.dataSource.getRepository(ParticipantEntryEntity);
    const participantEntities = await participantsRepository.find({
      where: { eventId },
      order: { raceId: 'ASC', entryClassId: 'ASC', submittedAt: 'ASC' }
    });

    const participantsByRaceClass = this.groupParticipantsByRaceAndClass(participantEntities);

    const races: ParticipantEntryRaceListDto[] = entryReceptions.map((reception) => {
      const entryClasses: ParticipantEntryClassListDto[] = (reception.entryClasses ?? [])
        .sort((left, right) => left.classId.localeCompare(right.classId))
        .map((entryClass) => {
          const key = this.buildRaceClassKey(reception.raceId, entryClass.classId);
          const participants = participantsByRaceClass.get(key) ?? [];
          return {
            classId: entryClass.classId,
            className: entryClass.name,
            capacity: entryClass.capacity ?? undefined,
            participantCount: participants.length,
            participants: participants.map((participant) => ({
              entryId: participant.id,
              name: participant.participantName,
              email: participant.participantEmail,
              submittedAt: new Date(participant.submittedAt.getTime())
            }))
          } satisfies ParticipantEntryClassListDto;
        });

      const participantCount = entryClasses.reduce(
        (total, entryClass) => total + entryClass.participantCount,
        0
      );

      return {
        raceId: reception.raceId,
        raceName: reception.raceId,
        participantCount,
        entryClasses
      } satisfies ParticipantEntryRaceListDto;
    });

    const totalParticipants = races.reduce(
      (total, race) => total + race.participantCount,
      0
    );

    return {
      eventId: event.id,
      eventName: event.name,
      totalParticipants,
      races
    } satisfies ParticipantEntriesResponseDto;
  }

  private groupParticipantsByRaceAndClass(
    participants: ParticipantEntryEntity[]
  ): Map<string, ParticipantEntryEntity[]> {
    const grouped = new Map<string, ParticipantEntryEntity[]>();

    for (const participant of participants) {
      const key = this.buildRaceClassKey(participant.raceId, participant.entryClassId);
      const existing = grouped.get(key);
      if (existing) {
        existing.push(participant);
      } else {
        grouped.set(key, [participant]);
      }
    }

    return grouped;
  }

  private buildRaceClassKey(raceId: string, classId: string): string {
    return `${raceId}::${classId}`;
  }
}

export default TypeOrmParticipantEntryQueryRepository;
