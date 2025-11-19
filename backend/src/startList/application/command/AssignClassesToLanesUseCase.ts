import StartListDraft from '../../domain/StartListDraft';
import EntryReceptionForStartListQuery from '../port/out/EntryReceptionForStartListQuery';
import StartListRepository from '../port/out/StartListRepository';
import AssignClassesToLanesCommand from './AssignClassesToLanesCommand';

class AssignClassesToLanesUseCase {
  public constructor(
    private readonly repository: StartListRepository,
    private readonly entryReceptionQuery: EntryReceptionForStartListQuery
  ) {}

  public async execute(command: AssignClassesToLanesCommand): Promise<StartListDraft> {
    const draft = await this.repository.findByEventAndRace(command.eventId, command.raceId);
    if (!draft) {
      throw new Error('スタートリストが未設定です。先に基本設定を完了してください。');
    }

    const entryClasses = await this.entryReceptionQuery.findEntryClasses(
      command.eventId,
      command.raceId
    );

    if (entryClasses.length === 0) {
      throw new Error('エントリー受付済みのクラスが存在しません。');
    }

    const classIdSet = new Set(entryClasses.map((entryClass) => entryClass.classId));
    const updated = draft.assignLanes(command.assignments, classIdSet);

    await this.repository.save(updated);
    return updated;
  }
}

export default AssignClassesToLanesUseCase;
