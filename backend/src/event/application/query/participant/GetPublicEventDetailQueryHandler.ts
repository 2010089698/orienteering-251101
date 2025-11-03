import type { PublicEventDetailResponse } from '@shared/event/contracts/PublicEventDetailContract';

import PublicEventDetailQueryRepository from '../../port/out/PublicEventDetailQueryRepository';
import GetPublicEventDetailQuery from './GetPublicEventDetailQuery';
import PublicEventDetailResponseDto from './PublicEventDetailResponseDto';

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function mapToResponse(dto: PublicEventDetailResponseDto): PublicEventDetailResponse {
  return {
    eventId: dto.id,
    eventName: dto.name,
    startDate: formatDateOnly(dto.startDate),
    endDate: formatDateOnly(dto.endDate),
    isMultiDayEvent: dto.isMultiDay,
    isMultiRaceEvent: dto.isMultiRace,
    raceSchedules: dto.raceSchedules.map((race) => ({
      name: race.name,
      date: formatDateOnly(race.scheduledDate)
    })),
    entryReceptionStatus: dto.entryReceptionStatus,
    startListStatus: dto.startListStatus,
    resultPublicationStatus: dto.resultPublicationStatus
  };
}

export class GetPublicEventDetailQueryHandler {
  public constructor(
    private readonly publicEventDetailQueryRepository: PublicEventDetailQueryRepository
  ) {}

  public async execute(
    query: GetPublicEventDetailQuery
  ): Promise<PublicEventDetailResponse> {
    const detail = await this.publicEventDetailQueryRepository.findDetailByEventId(query.eventId);

    if (!detail) {
      throw new Error('指定されたイベントが見つかりませんでした。');
    }

    return mapToResponse(detail);
  }
}

export default GetPublicEventDetailQueryHandler;
