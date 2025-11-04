import EventPeriod from '../../event/domain/EventPeriod';
import EntryClass from './EntryClass';
import ReceptionWindow from './ReceptionWindow';

interface EntryReceptionProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly receptionWindow: ReceptionWindow;
  readonly entryClasses: ReadonlyArray<EntryClass>;
}

class EntryReception {
  private constructor(
    private readonly eventId: string,
    private readonly raceId: string,
    private readonly window: ReceptionWindow,
    private readonly classes: ReadonlyArray<EntryClass>
  ) {}

  public static register(props: EntryReceptionProps, eventPeriod: EventPeriod): EntryReception {
    const eventId = props.eventId?.trim();
    if (!eventId) {
      throw new Error('イベントIDを指定してください。');
    }

    const raceId = props.raceId?.trim();
    if (!raceId) {
      throw new Error('レースIDを指定してください。');
    }

    if (!props.receptionWindow) {
      throw new Error('受付期間を指定してください。');
    }

    if (!props.entryClasses || props.entryClasses.length === 0) {
      throw new Error('エントリークラスを1つ以上指定してください。');
    }

    const uniqueClassIds = new Set(props.entryClasses.map((entryClass) => entryClass.identifier));
    if (uniqueClassIds.size !== props.entryClasses.length) {
      throw new Error('エントリークラスIDはレース内で一意でなければなりません。');
    }

    props.receptionWindow.ensureWithin(eventPeriod);

    return new EntryReception(
      eventId,
      raceId,
      props.receptionWindow,
      Object.freeze([...props.entryClasses])
    );
  }

  public static restore(props: EntryReceptionProps): EntryReception {
    const eventId = props.eventId?.trim();
    if (!eventId) {
      throw new Error('イベントIDを指定してください。');
    }

    const raceId = props.raceId?.trim();
    if (!raceId) {
      throw new Error('レースIDを指定してください。');
    }

    if (!props.receptionWindow) {
      throw new Error('受付期間を指定してください。');
    }

    if (!props.entryClasses || props.entryClasses.length === 0) {
      throw new Error('エントリークラスを1つ以上指定してください。');
    }

    return new EntryReception(
      eventId,
      raceId,
      props.receptionWindow,
      Object.freeze([...props.entryClasses])
    );
  }

  public get eventIdentifier(): string {
    return this.eventId;
  }

  public get targetRaceId(): string {
    return this.raceId;
  }

  public get receptionWindow(): ReceptionWindow {
    return this.window;
  }

  public get entryClasses(): ReadonlyArray<EntryClass> {
    return [...this.classes];
  }
}

export type { EntryReceptionProps };
export default EntryReception;
