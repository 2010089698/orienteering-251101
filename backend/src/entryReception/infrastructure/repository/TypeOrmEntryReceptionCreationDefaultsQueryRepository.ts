import { DataSource } from 'typeorm';

import EntryReceptionCreationDefaultsQueryRepository from '../../application/query/port/out/EntryReceptionCreationDefaultsQueryRepository';
import EntryReceptionCreationDefaultsResponseDto, {
  EntryReceptionRaceDefaultsDto,
  EntryReceptionClassTemplateDto
} from '../../application/query/EntryReceptionCreationDefaultsResponseDto';
import { EventEntity } from '../../../event/infrastructure/repository/EventEntity';
import { RaceScheduleEntity } from '../../../event/infrastructure/repository/RaceScheduleEntity';
import EntryReceptionEntity from './EntryReceptionEntity';
import EntryReceptionClassEntity from './EntryReceptionClassEntity';

export class TypeOrmEntryReceptionCreationDefaultsQueryRepository
  implements EntryReceptionCreationDefaultsQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findByEventId(
    eventId: string
  ): Promise<EntryReceptionCreationDefaultsResponseDto | null> {
    const eventRepository = this.dataSource.getRepository(EventEntity);
    const event = await eventRepository.findOne({
      where: { id: eventId },
      relations: { raceSchedules: true }
    });

    if (!event) {
      return null;
    }

    const raceSchedules = [...(event.raceSchedules ?? [])].sort(
      (left: RaceScheduleEntity, right: RaceScheduleEntity) =>
        left.scheduledDate.getTime() - right.scheduledDate.getTime()
    );

    const entryReceptionRepository = this.dataSource.getRepository(EntryReceptionEntity);
    const entryReceptions = await entryReceptionRepository.find({
      where: { eventId },
      relations: { entryClasses: true }
    });

    const entryReceptionByRaceId = new Map<string, EntryReceptionEntity>();
    for (const reception of entryReceptions) {
      entryReceptionByRaceId.set(reception.raceId, reception);
    }

    const races: EntryReceptionRaceDefaultsDto[] = raceSchedules.map((schedule) => {
      const reception = entryReceptionByRaceId.get(schedule.name);

      return {
        raceId: schedule.name,
        raceName: schedule.name,
        defaultReceptionStart: reception?.receptionStart,
        defaultReceptionEnd: reception?.receptionEnd,
        classTemplates: this.mapClassTemplates(reception?.entryClasses ?? [])
      } satisfies EntryReceptionRaceDefaultsDto;
    });

    return {
      eventId: event.id,
      eventName: event.name,
      races
    } satisfies EntryReceptionCreationDefaultsResponseDto;
  }

  private mapClassTemplates(
    entryClasses: EntryReceptionClassEntity[]
  ): ReadonlyArray<EntryReceptionClassTemplateDto> {
    return entryClasses.map(
      (entryClass): EntryReceptionClassTemplateDto => ({
        classId: entryClass.classId,
        name: entryClass.name,
        capacity: entryClass.capacity ?? undefined
      })
    );
  }
}

export default TypeOrmEntryReceptionCreationDefaultsQueryRepository;
