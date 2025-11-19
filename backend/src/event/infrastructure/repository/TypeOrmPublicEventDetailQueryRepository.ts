import { DataSource } from 'typeorm';

import PublicEventDetailQueryRepository from '../../application/port/out/PublicEventDetailQueryRepository';
import PublicEventDetailResponseDto, {
  PublicRaceScheduleDetailDto
} from '../../application/query/participant/PublicEventDetailResponseDto';
import EntryReceptionStatusCalculator from '../../domain/service/EntryReceptionStatusCalculator';
import { EventEntity } from './EventEntity';
import EntryReceptionEntity from '../../../entryReception/infrastructure/repository/EntryReceptionEntity';
import StartListDraftEntity from '../../../startList/infrastructure/repository/StartListDraftEntity';

const entryReceptionStatusCalculator = new EntryReceptionStatusCalculator();

export class TypeOrmPublicEventDetailQueryRepository
  implements PublicEventDetailQueryRepository
{
  public constructor(private readonly dataSource: DataSource) {}

  public async findDetailByEventId(
    eventId: string
  ): Promise<PublicEventDetailResponseDto | null> {
    const repository = this.dataSource.getRepository(EventEntity);

    const event = await repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.raceSchedules', 'raceSchedule')
      .where('event.id = :eventId', { eventId })
      .andWhere('event.is_public = :isPublic', { isPublic: true })
      .orderBy('raceSchedule.scheduled_date', 'ASC')
      .getOne();

    if (!event) {
      return null;
    }

    const raceSchedules: PublicRaceScheduleDetailDto[] = (event.raceSchedules ?? [])
      .map((schedule) => ({
        name: schedule.name,
        scheduledDate: schedule.scheduledDate
      }))
      .sort((left, right) => left.scheduledDate.getTime() - right.scheduledDate.getTime());

    const entryReceptionRepository = this.dataSource.getRepository(EntryReceptionEntity);
    const entryReceptions = await entryReceptionRepository.find({
      where: { eventId },
    });

    const entryReceptionStatus = entryReceptionStatusCalculator.determineStatus(
      entryReceptions.map((reception) => ({
        start: reception.receptionStart,
        end: reception.receptionEnd,
      })),
      new Date()
    );

    const startListRepository = this.dataSource.getRepository(StartListDraftEntity);
    const startLists = await startListRepository.find({ where: { eventId } });
    const startListStatus: PublicEventDetailResponseDto['startListStatus'] =
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
      raceSchedules,
      entryReceptionStatus,
      startListStatus,
      resultPublicationStatus: 'NOT_PUBLISHED'
    } satisfies PublicEventDetailResponseDto;
  }
}

export default TypeOrmPublicEventDetailQueryRepository;
