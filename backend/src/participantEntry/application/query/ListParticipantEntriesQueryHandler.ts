import ParticipantEntryQueryRepository from '../port/out/ParticipantEntryQueryRepository';
import ListParticipantEntriesQuery from './ListParticipantEntriesQuery';
import ParticipantEntriesResponseDto from './ParticipantEntriesResponseDto';

class ListParticipantEntriesQueryHandler {
  public constructor(
    private readonly participantEntryQueryRepository: ParticipantEntryQueryRepository
  ) {}

  public async execute(
    query: ListParticipantEntriesQuery
  ): Promise<ParticipantEntriesResponseDto> {
    const trimmedEventId = query.eventId?.trim();

    if (!trimmedEventId) {
      throw new Error('イベントIDを指定してください。');
    }

    const snapshot = await this.participantEntryQueryRepository.listByEventId(trimmedEventId);

    if (!snapshot) {
      throw new Error('指定されたイベントが見つかりませんでした。');
    }

    return snapshot;
  }
}

export default ListParticipantEntriesQueryHandler;
