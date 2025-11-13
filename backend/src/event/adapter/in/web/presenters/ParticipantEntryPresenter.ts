import type { ParticipantEntrySelectionResponse } from '@shared/event/contracts/ParticipantEntryContract';
import type { PublicEventDetailResponse } from '@shared/event/contracts/PublicEventDetailContract';

import ParticipantEntryOptionsResponseDto from '../../../../../participantEntry/application/query/ParticipantEntryOptionsResponseDto';

type EntryReceptionStatus = ParticipantEntrySelectionResponse['entryReceptionStatus'];

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function determineEntryReceptionStatus(
  currentStatus: EntryReceptionStatus,
  options: ParticipantEntryOptionsResponseDto,
  referenceDate: Date
): EntryReceptionStatus {
  if (currentStatus !== 'NOT_REGISTERED') {
    return currentStatus;
  }

  const { opensAt, closesAt } = options.receptionWindow;
  const now = referenceDate.getTime();
  const start = opensAt.getTime();
  const end = closesAt.getTime();

  if (start <= now && now <= end) {
    return 'OPEN';
  }

  return 'CLOSED';
}

function determineRaceDate(
  eventDetail: PublicEventDetailResponse,
  options: ParticipantEntryOptionsResponseDto,
  raceName: string
): string {
  const schedule = eventDetail.raceSchedules.find((race) => race.name === raceName);
  if (schedule) {
    return schedule.date;
  }

  if (eventDetail.raceSchedules.length > 0) {
    return eventDetail.raceSchedules[0]?.date;
  }

  return formatDateOnly(options.receptionWindow.opensAt);
}

export function presentParticipantEntryOptions(
  eventDetail: PublicEventDetailResponse,
  options: ParticipantEntryOptionsResponseDto,
  referenceDate: Date
): ParticipantEntrySelectionResponse {
  const raceName = eventDetail.raceSchedules.find(
    (race) => race.name === options.raceId
  )?.name ?? options.raceId;
  const entryReceptionStatus = determineEntryReceptionStatus(
    eventDetail.entryReceptionStatus,
    options,
    referenceDate
  );

  return {
    eventId: eventDetail.eventId,
    eventName: eventDetail.eventName,
    entryReceptionStatus,
    races: [
      {
        raceId: options.raceId,
        raceName,
        raceDate: determineRaceDate(eventDetail, options, raceName),
        receptionStart: formatDateTime(options.receptionWindow.opensAt),
        receptionEnd: formatDateTime(options.receptionWindow.closesAt),
        entryClasses: options.entryClasses.map(
          (entryClass): { classId: string; name: string } => ({
            classId: entryClass.id,
            name: entryClass.name,
          })
        ),
      },
    ],
  } satisfies ParticipantEntrySelectionResponse;
}

export default presentParticipantEntryOptions;
