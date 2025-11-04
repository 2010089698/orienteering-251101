class GetEntryReceptionPreparationQuery {
  private constructor(public readonly eventId: string) {}

  public static forEvent(eventId: string): GetEntryReceptionPreparationQuery {
    if (!eventId || eventId.trim().length === 0) {
      throw new Error('イベントIDを指定してください。');
    }

    return new GetEntryReceptionPreparationQuery(eventId);
  }
}

export default GetEntryReceptionPreparationQuery;
