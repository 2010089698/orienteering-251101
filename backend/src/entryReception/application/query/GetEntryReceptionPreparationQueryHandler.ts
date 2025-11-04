import EntryReceptionPreparationQueryRepository from './port/out/EntryReceptionPreparationQueryRepository';
import GetEntryReceptionPreparationQuery from './GetEntryReceptionPreparationQuery';
import EntryReceptionPreparationResponseDto from './EntryReceptionPreparationResponseDto';

export class GetEntryReceptionPreparationQueryHandler {
  public constructor(
    private readonly entryReceptionQueryRepository: EntryReceptionPreparationQueryRepository
  ) {}

  public async execute(
    query: GetEntryReceptionPreparationQuery
  ): Promise<EntryReceptionPreparationResponseDto> {
    const preparation = await this.entryReceptionQueryRepository.findByEventId(
      query.eventId
    );

    if (!preparation) {
      throw new Error('指定されたイベントのエントリー受付情報が見つかりません。');
    }

    return preparation;
  }
}

export default GetEntryReceptionPreparationQueryHandler;
