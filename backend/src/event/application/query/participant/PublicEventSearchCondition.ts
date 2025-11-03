export type PublicEventStatus = 'upcoming' | 'ongoing' | 'past';

export interface PublicEventSearchConditionProps {
  readonly startDateFrom?: Date;
  readonly startDateTo?: Date;
  readonly statuses?: ReadonlyArray<PublicEventStatus>;
  readonly referenceDate?: Date;
}

function cloneDate(value: Date | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = value.getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error('検索条件の日付形式が不正です。');
  }

  return new Date(timestamp);
}

export class PublicEventSearchCondition {
  private constructor(
    private readonly startFrom?: Date,
    private readonly startTo?: Date,
    private readonly statusSet: ReadonlySet<PublicEventStatus> = new Set(),
    private readonly reference: Date = new Date()
  ) {}

  public static create(props: PublicEventSearchConditionProps = {}): PublicEventSearchCondition {
    const startFrom = cloneDate(props.startDateFrom);
    const startTo = cloneDate(props.startDateTo);

    if (startFrom && startTo && startFrom.getTime() > startTo.getTime()) {
      throw new Error('イベント開始日の検索範囲が不正です。');
    }

    const referenceDate = cloneDate(props.referenceDate) ?? new Date();
    const statuses = new Set(props.statuses ?? []);

    return new PublicEventSearchCondition(startFrom, startTo, statuses, referenceDate);
  }

  public get startDateFrom(): Date | undefined {
    return cloneDate(this.startFrom);
  }

  public get startDateTo(): Date | undefined {
    return cloneDate(this.startTo);
  }

  public get statuses(): ReadonlySet<PublicEventStatus> {
    return new Set(this.statusSet);
  }

  public get referenceDate(): Date {
    return cloneDate(this.reference) ?? new Date();
  }
}

export default PublicEventSearchCondition;
