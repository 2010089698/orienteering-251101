export interface LaneClassAssignmentDto {
  readonly laneNumber: number;
  readonly entryClassId: string;
}

export interface AssignClassesToLanesCommandProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly assignments: ReadonlyArray<LaneClassAssignmentDto>;
}

class AssignClassesToLanesCommand {
  private constructor(private readonly props: AssignClassesToLanesCommandProps) {}

  public static from(props: AssignClassesToLanesCommandProps): AssignClassesToLanesCommand {
    return new AssignClassesToLanesCommand({
      ...props,
      assignments: [...props.assignments],
    });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get raceId(): string {
    return this.props.raceId;
  }

  public get assignments(): ReadonlyArray<LaneClassAssignmentDto> {
    return [...this.props.assignments];
  }
}

export default AssignClassesToLanesCommand;
