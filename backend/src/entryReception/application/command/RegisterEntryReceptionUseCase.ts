import EventPeriod from '../../../event/domain/EventPeriod';
import EntryClass from '../../domain/EntryClass';
import EntryReception from '../../domain/EntryReception';
import ReceptionWindow from '../../domain/ReceptionWindow';
import EntryReceptionRepository from '../port/out/EntryReceptionRepository';
import EventScheduleQueryRepository from '../port/out/EventScheduleQueryRepository';
import RegisterEntryReceptionCommand from './RegisterEntryReceptionCommand';

class RegisterEntryReceptionUseCase {
  constructor(
    private readonly entryReceptionRepository: EntryReceptionRepository,
    private readonly eventScheduleQueryRepository: EventScheduleQueryRepository
  ) {}

  public async execute(command: RegisterEntryReceptionCommand): Promise<EntryReception> {
    const eventDetail = await this.eventScheduleQueryRepository.findByEventId(command.eventId);
    if (!eventDetail) {
      throw new Error('指定されたイベントが存在しません。');
    }

    const raceExists = eventDetail.raceSchedules.some((race) => race.id === command.raceId);
    if (!raceExists) {
      throw new Error('指定されたレースIDはイベントに存在しません。');
    }

    const receptionStart = this.parseDateTime(command.receptionStart, '受付開始日時');
    const receptionEnd = this.parseDateTime(command.receptionEnd, '受付終了日時');

    const receptionWindow = ReceptionWindow.create(receptionStart, receptionEnd);
    const eventPeriod = EventPeriod.createFromBoundaries(eventDetail.startDate, eventDetail.endDate);

    const entryClasses = command.entryClasses.map((dto) =>
      EntryClass.create({
        id: dto.classId,
        name: dto.name,
        capacity: dto.capacity
      })
    );

    const entryReception = EntryReception.register(
      {
        eventId: command.eventId,
        raceId: command.raceId,
        receptionWindow,
        entryClasses
      },
      eventPeriod
    );

    await this.entryReceptionRepository.save(entryReception);

    return entryReception;
  }

  private parseDateTime(value: string | undefined, fieldName: string): Date {
    if (!value) {
      throw new Error(`${fieldName}を指定してください。`);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`${fieldName}の日付形式が正しくありません。`);
    }

    return parsed;
  }
}

export default RegisterEntryReceptionUseCase;
