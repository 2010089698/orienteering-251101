class GetPublicEventDetailQuery {
  private constructor(public readonly eventId: string) {}

  public static forEvent(eventId: string): GetPublicEventDetailQuery {
    if (!eventId || eventId.trim().length === 0) {
      throw new Error('イベントIDを指定してください。');
    }

    return new GetPublicEventDetailQuery(eventId);
  }
}

export default GetPublicEventDetailQuery;
