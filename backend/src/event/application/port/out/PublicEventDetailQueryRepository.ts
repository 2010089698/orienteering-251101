import PublicEventDetailResponseDto from '../../query/participant/PublicEventDetailResponseDto';

interface PublicEventDetailQueryRepository {
  findDetailByEventId(eventId: string): Promise<PublicEventDetailResponseDto | null>;
}

export default PublicEventDetailQueryRepository;
