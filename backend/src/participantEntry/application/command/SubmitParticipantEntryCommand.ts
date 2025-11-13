class SubmitParticipantEntryCommand {
  public constructor(
    public readonly eventId: string,
    public readonly raceId: string,
    public readonly entryClassId: string,
    public readonly participantName: string,
    public readonly participantEmail: string
  ) {}
}

export default SubmitParticipantEntryCommand;
