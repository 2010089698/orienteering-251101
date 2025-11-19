export interface ConfigureStartListCommandProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly startDateTime: string;
  readonly intervalSeconds: number;
  readonly laneCount: number;
}

class ConfigureStartListCommand {
  private constructor(private readonly props: ConfigureStartListCommandProps) {}

  public static from(props: ConfigureStartListCommandProps): ConfigureStartListCommand {
    return new ConfigureStartListCommand({ ...props });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get raceId(): string {
    return this.props.raceId;
  }

  public get startDateTime(): string {
    return this.props.startDateTime;
  }

  public get intervalSeconds(): number {
    return this.props.intervalSeconds;
  }

  public get laneCount(): number {
    return this.props.laneCount;
  }
}

export default ConfigureStartListCommand;
