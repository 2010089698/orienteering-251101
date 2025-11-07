class GetEntryReceptionCreationDefaultsQuery {
  private constructor(public readonly eventId: string) {}

  public static forEvent(eventId: string): GetEntryReceptionCreationDefaultsQuery {
    if (!eventId || eventId.trim().length === 0) {
      throw new Error('イベントIDを指定してください。');
    }

    return new GetEntryReceptionCreationDefaultsQuery(eventId);
  }
}

export default GetEntryReceptionCreationDefaultsQuery;
