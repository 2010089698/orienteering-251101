class ListParticipantEntriesQuery {
  private constructor(public readonly eventId: string) {}

  public static forEvent(eventId: string): ListParticipantEntriesQuery {
    const trimmed = eventId?.trim();
    if (!trimmed) {
      throw new Error('イベントIDを指定してください。');
    }

    return new ListParticipantEntriesQuery(trimmed);
  }
}

export default ListParticipantEntriesQuery;
