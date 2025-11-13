export interface EntryReceptionSummary {
  readonly eventId: string;
  readonly raceId: string;
  readonly receptionWindow: {
    readonly opensAt: Date;
    readonly closesAt: Date;
  };
  readonly entryClasses: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
}

export default EntryReceptionSummary;
