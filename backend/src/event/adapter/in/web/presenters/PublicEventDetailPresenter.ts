import type { PublicEventDetailResponse } from '@shared/event/contracts/PublicEventDetailContract';

import { formatDateOnly } from '../support/date';

export interface PublicEventDetailView {
  readonly eventId: string;
  readonly eventName: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isMultiDayEvent: boolean;
  readonly isMultiRaceEvent: boolean;
  readonly raceSchedules: ReadonlyArray<{
    readonly name: string;
    readonly date: string;
  }>;
  readonly entryReceptionStatus: PublicEventDetailResponse['entryReceptionStatus'];
  readonly startListStatus: PublicEventDetailResponse['startListStatus'];
  readonly resultPublicationStatus: PublicEventDetailResponse['resultPublicationStatus'];
}

function normalizeDateOnly(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('日付の形式が不正です。');
  }

  return formatDateOnly(parsed);
}

export function presentPublicEventDetail(
  detail: PublicEventDetailResponse
): PublicEventDetailView {
  return {
    eventId: detail.eventId,
    eventName: detail.eventName,
    startDate: normalizeDateOnly(detail.startDate),
    endDate: normalizeDateOnly(detail.endDate),
    isMultiDayEvent: detail.isMultiDayEvent,
    isMultiRaceEvent: detail.isMultiRaceEvent,
    raceSchedules: detail.raceSchedules.map((schedule) => ({
      name: schedule.name,
      date: normalizeDateOnly(schedule.date)
    })),
    entryReceptionStatus: detail.entryReceptionStatus,
    startListStatus: detail.startListStatus,
    resultPublicationStatus: detail.resultPublicationStatus
  };
}

export default presentPublicEventDetail;
