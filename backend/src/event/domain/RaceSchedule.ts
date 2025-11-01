import { normalizeToDateOnly } from './DateUtils';

export class RaceSchedule {
  private constructor(
    private readonly raceName: string,
    private readonly scheduledDate: Date
  ) {}

  public static create(name: string, date: Date): RaceSchedule {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new Error('レース名を指定してください。');
    }

    const normalizedDate = normalizeToDateOnly(date);

    return new RaceSchedule(trimmedName, normalizedDate);
  }

  public get name(): string {
    return this.raceName;
  }

  public get date(): Date {
    return new Date(this.scheduledDate.getTime());
  }

  public get dayIdentifier(): number {
    return this.scheduledDate.getTime();
  }
}

export default RaceSchedule;
