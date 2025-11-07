import GetEntryReceptionCreationDefaultsQuery from './GetEntryReceptionCreationDefaultsQuery';
import EntryReceptionCreationDefaultsResponseDto from './EntryReceptionCreationDefaultsResponseDto';
import EntryReceptionCreationDefaultsQueryRepository from './port/out/EntryReceptionCreationDefaultsQueryRepository';

export class GetEntryReceptionCreationDefaultsQueryHandler {
  public constructor(
    private readonly repository: EntryReceptionCreationDefaultsQueryRepository
  ) {}

  public async execute(
    query: GetEntryReceptionCreationDefaultsQuery
  ): Promise<EntryReceptionCreationDefaultsResponseDto> {
    const defaults = await this.repository.findByEventId(query.eventId);

    if (!defaults) {
      throw new Error('指定されたイベントが存在しません。');
    }

    return defaults;
  }
}

export default GetEntryReceptionCreationDefaultsQueryHandler;
