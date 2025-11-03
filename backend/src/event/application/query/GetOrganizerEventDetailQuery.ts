class GetOrganizerEventDetailQuery {
  private constructor(public readonly eventId: string) {}

  public static forEvent(eventId: string): GetOrganizerEventDetailQuery {
    if (!eventId || eventId.trim().length === 0) {
      throw new Error('イベントIDを指定してください。');
    }

    return new GetOrganizerEventDetailQuery(eventId);
  }
}

export default GetOrganizerEventDetailQuery;
