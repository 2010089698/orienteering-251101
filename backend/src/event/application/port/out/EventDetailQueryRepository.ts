import type OrganizerEventDetailResponseDto from '../../query/OrganizerEventDetailResponseDto';

interface EventDetailQueryRepository {
  findDetailByEventId(eventId: string): Promise<OrganizerEventDetailResponseDto | null>;
}

export default EventDetailQueryRepository;
