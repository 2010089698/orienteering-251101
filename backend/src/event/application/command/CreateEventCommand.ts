export interface RaceScheduleCommandDto {
  readonly name: string;
  readonly date: string;
}

export interface CreateEventCommandProps {
  readonly eventId: string;
  readonly eventName: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly raceSchedules: ReadonlyArray<RaceScheduleCommandDto>;
  readonly publishImmediately?: boolean;
}

/**
 * フォーム入力値を表現するコマンドDTO。
 * ドメインオブジェクトの生成はユースケースに委ね、
 * アプリケーション層でのバリデーションや組み立てを支援する。
 */
export class CreateEventCommand {
  private constructor(private readonly props: CreateEventCommandProps) {}

  public static from(props: CreateEventCommandProps): CreateEventCommand {
    return new CreateEventCommand({
      ...props,
      raceSchedules: [...props.raceSchedules]
    });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get eventName(): string {
    return this.props.eventName;
  }

  public get startDate(): string {
    return this.props.startDate;
  }

  public get endDate(): string | undefined {
    return this.props.endDate;
  }

  public get raceSchedules(): ReadonlyArray<RaceScheduleCommandDto> {
    return [...this.props.raceSchedules];
  }

  public get publishImmediately(): boolean {
    return this.props.publishImmediately ?? false;
  }
}

export default CreateEventCommand;
