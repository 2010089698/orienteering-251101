export interface ScheduleParticipantsCommandProps {
  readonly eventId: string;
  readonly raceId: string;
}

class ScheduleParticipantsCommand {
  private constructor(private readonly props: ScheduleParticipantsCommandProps) {}

  public static from(props: ScheduleParticipantsCommandProps): ScheduleParticipantsCommand {
    return new ScheduleParticipantsCommand({ ...props });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get raceId(): string {
    return this.props.raceId;
  }
}

export default ScheduleParticipantsCommand;
