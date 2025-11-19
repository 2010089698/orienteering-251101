import StartListRepository from '../port/out/StartListRepository';
import GetStartListDraftQuery from './GetStartListDraftQuery';
import StartListDraftResponseDto, {
  toStartListDraftResponseDto,
} from './StartListDraftResponseDto';

class GetStartListDraftQueryHandler {
  public constructor(private readonly repository: StartListRepository) {}

  public async execute(
    query: GetStartListDraftQuery
  ): Promise<StartListDraftResponseDto> {
    const draft = await this.repository.findByEventAndRace(
      query.eventId,
      query.raceId
    );

    if (!draft) {
      throw new Error('指定されたスタートリストが見つかりません。');
    }

    return toStartListDraftResponseDto(draft);
  }
}

export default GetStartListDraftQueryHandler;
