class GetStartListDraftQuery {
  private constructor(private readonly props: { eventId: string; raceId: string }) {}

  public static forRace(eventId: string, raceId: string): GetStartListDraftQuery {
    if (!eventId?.trim()) {
      throw new Error('イベントIDを指定してください。');
    }

    if (!raceId?.trim()) {
      throw new Error('レースIDを指定してください。');
    }

    return new GetStartListDraftQuery({ eventId, raceId });
  }

  public get eventId(): string {
    return this.props.eventId;
  }

  public get raceId(): string {
    return this.props.raceId;
  }
}

export default GetStartListDraftQuery;
