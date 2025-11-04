export interface RegisterEntryClassCommandDto {
  readonly classId: string;
  readonly name: string;
  readonly capacity?: number;
}

export interface RegisterEntryReceptionCommandProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly receptionStart: string;
  readonly receptionEnd: string;
  readonly entryClasses: ReadonlyArray<RegisterEntryClassCommandDto>;
}

class RegisterEntryReceptionCommand {
  private constructor(private readonly props: RegisterEntryReceptionCommandProps) {}

  public static from(props: RegisterEntryReceptionCommandProps): RegisterEntryReceptionCommand {
    return new RegisterEntryReceptionCommand({
      ...props,
      entryClasses: [...props.entryClasses]
    });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get raceId(): string {
    return this.props.raceId;
  }

  public get receptionStart(): string {
    return this.props.receptionStart;
  }

  public get receptionEnd(): string {
    return this.props.receptionEnd;
  }

  public get entryClasses(): ReadonlyArray<RegisterEntryClassCommandDto> {
    return [...this.props.entryClasses];
  }
}

export default RegisterEntryReceptionCommand;
