import EventSummaryResponseDto from '../../../../application/query/EventSummaryResponseDto';
import { formatDateOnly } from '../support/date';

export interface PublicEventSummaryResponse {
  readonly eventId: string;
  readonly eventName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isMultiDayEvent: boolean;
  readonly isMultiRaceEvent: boolean;
}

export function presentEventSummary(
  summary: EventSummaryResponseDto
): PublicEventSummaryResponse {
  const startDate = new Date(summary.startDate);
  const endDate = new Date(summary.endDate);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error('イベント開始日の形式が不正です。');
  }

  if (Number.isNaN(endDate.getTime())) {
    throw new Error('イベント終了日の形式が不正です。');
  }

  return {
    eventId: summary.id,
    eventName: summary.name,
    startDate: formatDateOnly(startDate),
    endDate: formatDateOnly(endDate),
    isMultiDayEvent: summary.isMultiDay,
    isMultiRaceEvent: summary.isMultiRace
  };
}

export default presentEventSummary;
