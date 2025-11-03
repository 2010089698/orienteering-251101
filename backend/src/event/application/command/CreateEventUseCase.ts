import Event, { EventProps } from '../../domain/Event';
import EventPeriod from '../../domain/EventPeriod';
import RaceSchedule from '../../domain/RaceSchedule';
import { CreateEventCommand, RaceScheduleCommandDto } from './CreateEventCommand';
import EventRepository from '../port/out/EventRepository';
import PublishEventUseCase from './PublishEventUseCase';
import PublishEventCommand from './PublishEventCommand';

export class CreateEventUseCase {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly publishEventUseCase?: PublishEventUseCase
  ) {}

  public async execute(command: CreateEventCommand): Promise<Event> {
    const basePeriod = this.createBasePeriod(command);
    const raceSchedules = command.raceSchedules.map((schedule, index) =>
      this.createRaceSchedule(schedule, index)
    );

    const eventProps: EventProps = {
      id: command.eventId,
      name: command.eventName,
      period: basePeriod,
      raceSchedules
    };

    const event = Event.create(eventProps);
    await this.eventRepository.save(event);

    if (command.publishImmediately) {
      if (!this.publishEventUseCase) {
        throw new Error('即時公開を行うには公開ユースケースが必要です。');
      }

      const publishCommand = PublishEventCommand.forEvent(event.eventIdentifier);
      return this.publishEventUseCase.execute(publishCommand);
    }

    return event;
  }

  private createBasePeriod(command: CreateEventCommand): EventPeriod {
    const startDate = this.parseDate(command.startDate, 'イベント開始日');

    if (!command.endDate) {
      return EventPeriod.createSingleDay(startDate);
    }

    const endDate = this.parseDate(command.endDate, 'イベント終了日');

    return EventPeriod.createFromBoundaries(startDate, endDate);
  }

  private createRaceSchedule(dto: RaceScheduleCommandDto, index: number): RaceSchedule {
    const date = this.parseDate(dto.date, `レース日程(${index + 1}件目)`);
    return RaceSchedule.create(dto.name, date);
  }

  private parseDate(value: string | undefined, fieldName: string): Date {
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

export default CreateEventUseCase;
