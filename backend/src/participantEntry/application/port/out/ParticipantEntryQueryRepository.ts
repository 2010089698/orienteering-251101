import ParticipantEntriesResponseDto from '../../query/ParticipantEntriesResponseDto';

interface ParticipantEntryQueryRepository {
  listByEventId(eventId: string): Promise<ParticipantEntriesResponseDto | null>;
}

export default ParticipantEntryQueryRepository;
