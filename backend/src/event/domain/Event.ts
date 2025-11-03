import EventPeriod from './EventPeriod';
import EventSchedulingService from './EventSchedulingService';
import RaceSchedule from './RaceSchedule';

export interface EventProps {
  id: string;
  name: string;
  period: EventPeriod;
  raceSchedules: RaceSchedule[];
  isPublic?: boolean;
}

export class Event {
  private constructor(
    private readonly eventId: string,
    private readonly eventName: string,
    private readonly eventPeriod: EventPeriod,
    private readonly multiDay: boolean,
    private readonly multiRace: boolean,
    private readonly schedules: ReadonlyArray<RaceSchedule>,
    private isPubliclyVisible: boolean
  ) {}

  public static create(props: EventProps): Event {
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
      id,
      name,
      period,
      isMultiDay,
      isMultiRace,
      Object.freeze([...props.raceSchedules]),
      props.isPublic ?? false
    );
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

  public get isPublic(): boolean {
    return this.isPubliclyVisible;
  }

  public publish(): void {
    if (this.isPubliclyVisible) {
      throw new Error('イベントは既に公開されています。');
    }

    this.isPubliclyVisible = true;
  }

  public unpublish(): void {
    if (!this.isPubliclyVisible) {
      throw new Error('イベントはまだ公開されていません。');
    }

    this.isPubliclyVisible = false;
  }
}

export default Event;
