export type EntryReceptionStatus = 'NOT_REGISTERED' | 'OPEN' | 'CLOSED';

export interface EntryReceptionPeriod {
  readonly start: Date;
  readonly end: Date;
}

export class EntryReceptionStatusCalculator {
  public determineStatus(
    receptions: ReadonlyArray<EntryReceptionPeriod>,
    referenceDate: Date
  ): EntryReceptionStatus {
    if (receptions.length === 0) {
      return 'NOT_REGISTERED';
    }

    const now = referenceDate.getTime();
    const isOpen = receptions.some((reception) => {
      const start = reception.start.getTime();
      const end = reception.end.getTime();

      return start <= now && now <= end;
    });

    return isOpen ? 'OPEN' : 'CLOSED';
  }
}

export default EntryReceptionStatusCalculator;
