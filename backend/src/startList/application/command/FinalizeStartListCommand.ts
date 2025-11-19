export interface FinalizeStartListCommandProps {
  readonly eventId: string;
  readonly raceId: string;
}

class FinalizeStartListCommand {
  private constructor(private readonly props: FinalizeStartListCommandProps) {}

  public static from(props: FinalizeStartListCommandProps): FinalizeStartListCommand {
    return new FinalizeStartListCommand({ ...props });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get raceId(): string {
    return this.props.raceId;
  }
}

export default FinalizeStartListCommand;
