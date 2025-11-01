import { normalizeToDateOnly, isSameDay } from './DateUtils';

export class EventPeriod {
  private constructor(
    private readonly start: Date,
    private readonly end: Date
  ) {}

  public static createSingleDay(date: Date): EventPeriod {
    const normalized = normalizeToDateOnly(date);
    return new EventPeriod(normalized, normalized);
  }

  public static createMultiDay(startDate: Date, endDate: Date): EventPeriod {
    const normalizedStart = normalizeToDateOnly(startDate);
    const normalizedEnd = normalizeToDateOnly(endDate);

    if (normalizedEnd.getTime() < normalizedStart.getTime()) {
      throw new Error('イベント期間の終了日は開始日以降でなければなりません。');
    }

    if (isSameDay(normalizedStart, normalizedEnd)) {
      throw new Error('単日の場合は createSingleDay を利用してください。');
    }

    return new EventPeriod(normalizedStart, normalizedEnd);
  }

  public static createFromBoundaries(startDate: Date, endDate: Date): EventPeriod {
    const normalizedStart = normalizeToDateOnly(startDate);
    const normalizedEnd = normalizeToDateOnly(endDate);

    if (normalizedEnd.getTime() < normalizedStart.getTime()) {
      throw new Error('イベント期間の終了日は開始日以降でなければなりません。');
    }

    return new EventPeriod(normalizedStart, normalizedEnd);
  }

  public get startDate(): Date {
    return new Date(this.start.getTime());
  }

  public get endDate(): Date {
    return new Date(this.end.getTime());
  }

  public get isSingleDay(): boolean {
    return this.start.getTime() === this.end.getTime();
  }

  public contains(date: Date): boolean {
    const normalized = normalizeToDateOnly(date);
    return (
      normalized.getTime() >= this.start.getTime() &&
      normalized.getTime() <= this.end.getTime()
    );
  }

  public extendToCover(date: Date): EventPeriod {
    const normalized = normalizeToDateOnly(date);
    const newStart = this.start.getTime() <= normalized.getTime() ? this.start : normalized;
    const newEnd = this.end.getTime() >= normalized.getTime() ? this.end : normalized;
    return EventPeriod.createFromBoundaries(newStart, newEnd);
  }

  public static covering(dates: Date[]): EventPeriod {
    if (dates.length === 0) {
      throw new Error('期間を生成するための日付が必要です。');
    }

    const normalizedDates = dates.map(normalizeToDateOnly);
    normalizedDates.sort((left, right) => left.getTime() - right.getTime());

    const first = normalizedDates[0];
    const last = normalizedDates[normalizedDates.length - 1];

    return EventPeriod.createFromBoundaries(first, last);
  }
}

export default EventPeriod;
