import { DataSource } from 'typeorm';

import EventDetailQueryRepository from '../../application/port/out/EventDetailQueryRepository';
import OrganizerEventDetailResponseDto, {
  RaceScheduleDetailDto
} from '../../application/query/OrganizerEventDetailResponseDto';
import EntryReceptionStatusCalculator from '../../domain/service/EntryReceptionStatusCalculator';
import { EventEntity } from './EventEntity';
import EntryReceptionEntity from '../../../entryReception/infrastructure/repository/EntryReceptionEntity';
import StartListDraftEntity from '../../../startList/infrastructure/repository/StartListDraftEntity';

const entryReceptionStatusCalculator = new EntryReceptionStatusCalculator();

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

    const entryReceptionStatus = entryReceptionStatusCalculator.determineStatus(
      entryReceptions.map((reception) => ({
        start: reception.receptionStart,
        end: reception.receptionEnd
      })),
      new Date()
    );

    const startListRepository = this.dataSource.getRepository(StartListDraftEntity);
    const startLists = await startListRepository.find({ where: { eventId } });
    const startListStatus: OrganizerEventDetailResponseDto['startListStatus'] =
      startLists.length === 0
        ? 'NOT_CREATED'
        : startLists.some((list) => list.isFinalized)
          ? 'PUBLISHED'
          : 'DRAFT';

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
      startListStatus,
      resultPublicationStatus: 'NOT_PUBLISHED'
    } satisfies OrganizerEventDetailResponseDto;
  }
}

export default TypeOrmEventDetailQueryRepository;
