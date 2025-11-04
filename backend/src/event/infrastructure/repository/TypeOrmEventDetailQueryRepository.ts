import { DataSource } from 'typeorm';

import EventDetailQueryRepository from '../../application/port/out/EventDetailQueryRepository';
import OrganizerEventDetailResponseDto, {
  RaceScheduleDetailDto
} from '../../application/query/OrganizerEventDetailResponseDto';
import { EventEntity } from './EventEntity';
import EntryReceptionEntity from '../../../entryReception/infrastructure/repository/EntryReceptionEntity';

type EntryReceptionStatus =
  | 'NOT_REGISTERED'
  | 'OPEN'
  | 'CLOSED';

function determineEntryReceptionStatus(
  receptions: EntryReceptionEntity[],
  referenceDate: Date
): EntryReceptionStatus {
  if (receptions.length === 0) {
    return 'NOT_REGISTERED';
  }

  const now = referenceDate.getTime();
  const isOpen = receptions.some((reception) => {
    const start = reception.receptionStart.getTime();
    const end = reception.receptionEnd.getTime();
    return start <= now && now <= end;
  });

  return isOpen ? 'OPEN' : 'CLOSED';
}

export class TypeOrmEventDetailQueryRepository implements EventDetailQueryRepository {
  public constructor(private readonly dataSource: DataSource) {}

  public async findDetailByEventId(
    eventId: string
  ): Promise<OrganizerEventDetailResponseDto | null> {
    const repository = this.dataSource.getRepository(EventEntity);

    const event = await repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.raceSchedules', 'raceSchedule')
      .where('event.id = :eventId', { eventId })
      .orderBy('raceSchedule.scheduled_date', 'ASC')
      .getOne();

    if (!event) {
      return null;
    }

    const raceSchedules: RaceScheduleDetailDto[] = (event.raceSchedules ?? [])
      .map((schedule) => ({
        name: schedule.name,
        scheduledDate: schedule.scheduledDate
      }))
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    const entryReceptionRepository = this.dataSource.getRepository(EntryReceptionEntity);
    const entryReceptions = await entryReceptionRepository.find({
      where: { eventId },
    });

    const entryReceptionStatus = determineEntryReceptionStatus(
      entryReceptions,
      new Date()
    );

    return {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      isMultiDay: event.isMultiDay,
      isMultiRace: event.isMultiRace,
      isPublic: event.isPublic,
      raceSchedules,
      entryReceptionStatus,
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    } satisfies OrganizerEventDetailResponseDto;
  }
}

export default TypeOrmEventDetailQueryRepository;
