import type { OrganizerEventDetailResponse } from '@shared/event/contracts/OrganizerEventDetailContract';

import EventDetailQueryRepository from '../port/out/EventDetailQueryRepository';
import GetOrganizerEventDetailQuery from './GetOrganizerEventDetailQuery';
import OrganizerEventDetailResponseDto from './OrganizerEventDetailResponseDto';

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function mapToResponse(dto: OrganizerEventDetailResponseDto): OrganizerEventDetailResponse {
  return {
    eventId: dto.id,
    eventName: dto.name,
    startDate: formatDateOnly(dto.startDate),
    endDate: formatDateOnly(dto.endDate),
    isMultiDayEvent: dto.isMultiDay,
    isMultiRaceEvent: dto.isMultiRace,
    isPublic: dto.isPublic,
    raceSchedules: dto.raceSchedules.map((race) => ({
      name: race.name,
      date: formatDateOnly(race.scheduledDate)
    })),
    entryReceptionStatus: dto.entryReceptionStatus,
    startListStatus: dto.startListStatus,
    resultPublicationStatus: dto.resultPublicationStatus
  };
}

export class GetOrganizerEventDetailQueryHandler {
  public constructor(
    private readonly eventDetailQueryRepository: EventDetailQueryRepository
  ) {}

  public async execute(
    query: GetOrganizerEventDetailQuery
  ): Promise<OrganizerEventDetailResponse> {
    const detail = await this.eventDetailQueryRepository.findDetailByEventId(query.eventId);

    if (!detail) {
      throw new Error('指定されたイベントが見つかりませんでした。');
    }

    return mapToResponse(detail);
  }
}

export default GetOrganizerEventDetailQueryHandler;
