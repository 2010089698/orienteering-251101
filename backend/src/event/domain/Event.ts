import EventPeriod from './EventPeriod';
import EventSchedulingService from './EventSchedulingService';
import RaceSchedule from './RaceSchedule';

export interface EventProps {
  organizerId: string;
  id: string;
  name: string;
  period: EventPeriod;
  raceSchedules: RaceSchedule[];
}

export class Event {
  private constructor(
    private readonly organizer: string,
    private readonly eventId: string,
    private readonly eventName: string,
    private readonly eventPeriod: EventPeriod,
    private readonly multiDay: boolean,
    private readonly multiRace: boolean,
    private readonly schedules: ReadonlyArray<RaceSchedule>
  ) {}

  public static create(props: EventProps): Event {
    const organizerId = props.organizerId?.trim();
    if (!organizerId) {
      throw new Error('主催者IDを指定してください。');
    }

    const id = props.id?.trim();
    if (!id) {
      throw new Error('イベントIDを指定してください。');
    }

    const name = props.name?.trim();
    if (!name) {
      throw new Error('イベント名を指定してください。');
    }

    if (!props.period) {
      throw new Error('イベント期間を指定してください。');
    }

    if (!props.raceSchedules || props.raceSchedules.length === 0) {
      throw new Error('イベントには少なくとも1つのレース日程が必要です。');
    }

    const uniqueRaceNames = new Set(props.raceSchedules.map((schedule) => schedule.name));
    if (uniqueRaceNames.size !== props.raceSchedules.length) {
      throw new Error('レース名はイベント内で一意でなければなりません。');
    }

    const { period, isMultiDay, isMultiRace } = EventSchedulingService.ensureConsistency(
      props.period,
      props.raceSchedules
    );

    return new Event(
      organizerId,
      id,
      name,
      period,
      isMultiDay,
      isMultiRace,
      Object.freeze([...props.raceSchedules])
    );
  }

  public get organizerIdentifier(): string {
    return this.organizer;
  }

  public get eventIdentifier(): string {
    return this.eventId;
  }

  public get displayName(): string {
    return this.eventName;
  }

  public get eventDuration(): EventPeriod {
    return this.eventPeriod;
  }

  public get isMultiDayEvent(): boolean {
    return this.multiDay;
  }

  public get isMultiRaceEvent(): boolean {
    return this.multiRace;
  }

  public get raceSchedules(): ReadonlyArray<RaceSchedule> {
    return [...this.schedules];
  }
}

export default Event;
