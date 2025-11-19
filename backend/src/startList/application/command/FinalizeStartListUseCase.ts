import StartListDraft from '../../domain/StartListDraft';
import StartListRepository from '../port/out/StartListRepository';
import FinalizeStartListCommand from './FinalizeStartListCommand';

class FinalizeStartListUseCase {
  public constructor(private readonly repository: StartListRepository) {}

  public async execute(command: FinalizeStartListCommand): Promise<StartListDraft> {
    const draft = await this.repository.findByEventAndRace(command.eventId, command.raceId);
    if (!draft) {
      throw new Error('スタートリストが未設定です。');
    }

    const finalized = draft.finalize();
    await this.repository.save(finalized);
    return finalized;
  }
}

export default FinalizeStartListUseCase;
