interface EntrySelectionProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly entryClassId: string;
}

class EntrySelection {
  private constructor(
    private readonly eventIdentifier: string,
    private readonly raceIdentifier: string,
    private readonly classIdentifier: string
  ) {}

  public static create(props: EntrySelectionProps): EntrySelection {
    const eventId = props.eventId?.trim();
    if (!eventId) {
      throw new Error('イベントIDを指定してください。');
    }

    const raceId = props.raceId?.trim();
    if (!raceId) {
      throw new Error('レースIDを指定してください。');
    }

    const entryClassId = props.entryClassId?.trim();
    if (!entryClassId) {
      throw new Error('エントリークラスIDを指定してください。');
    }

    return new EntrySelection(eventId, raceId, entryClassId);
  }

  public get eventId(): string {
    return this.eventIdentifier;
  }

  public get raceId(): string {
    return this.raceIdentifier;
  }

  public get entryClassId(): string {
    return this.classIdentifier;
  }
}

export type { EntrySelectionProps };
export default EntrySelection;
