import EventPeriod from '../../event/domain/EventPeriod';

class ReceptionWindow {
  private constructor(
    private readonly start: Date,
    private readonly end: Date
  ) {}

  public static create(start: Date, end: Date): ReceptionWindow {
    if (!start) {
      throw new Error('受付開始日時を指定してください。');
    }

    if (!end) {
      throw new Error('受付終了日時を指定してください。');
    }

    const startTime = new Date(start.getTime());
    const endTime = new Date(end.getTime());

    if (endTime.getTime() < startTime.getTime()) {
      throw new Error('受付期間の終了日時は開始日時以降でなければなりません。');
    }

    return new ReceptionWindow(startTime, endTime);
  }

  public ensureWithin(period: EventPeriod): void {
    if (!period) {
      throw new Error('イベント期間が指定されていません。');
    }

    if (!this.isBoundaryWithinPeriod(this.start, period) || !this.isBoundaryWithinPeriod(this.end, period)) {
      throw new Error('受付期間はイベント期間内に設定してください。');
    }
  }

  private isBoundaryWithinPeriod(boundary: Date, period: EventPeriod): boolean {
    return period.contains(boundary);
  }

  public get opensAt(): Date {
    return new Date(this.start.getTime());
  }

  public get closesAt(): Date {
    return new Date(this.end.getTime());
  }
}

export default ReceptionWindow;
