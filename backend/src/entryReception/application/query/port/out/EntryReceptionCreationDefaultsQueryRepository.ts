import EntryReceptionCreationDefaultsResponseDto from '../../EntryReceptionCreationDefaultsResponseDto';

interface EntryReceptionCreationDefaultsQueryRepository {
  findByEventId(
    eventId: string
  ): Promise<EntryReceptionCreationDefaultsResponseDto | null>;
}

export default EntryReceptionCreationDefaultsQueryRepository;
