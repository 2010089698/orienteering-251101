import EntryReceptionSummary from './EntryReceptionSummary';
import EntrySelection from '../value/EntrySelection';

class ParticipantEntryAcceptanceService {
  public ensureAcceptable(
    selection: EntrySelection,
    submittedAt: Date,
    reception: EntryReceptionSummary
  ): void {
    if (!reception) {
      throw new Error('受付情報が取得できません。');
    }

    if (selection.eventId !== reception.eventId) {
      throw new Error('指定されたイベントでは受付できません。');
    }

    if (selection.raceId !== reception.raceId) {
      throw new Error('指定されたレースは受付対象外です。');
    }

    if (!reception.receptionWindow) {
      throw new Error('受付期間が設定されていません。');
    }

    if (!reception.entryClasses || reception.entryClasses.length === 0) {
      throw new Error('受付対象のエントリークラスが設定されていません。');
    }

    const windowStart = reception.receptionWindow.opensAt.getTime();
    const windowEnd = reception.receptionWindow.closesAt.getTime();
    const submittedAtTime = submittedAt.getTime();

    if (submittedAtTime < windowStart || submittedAtTime > windowEnd) {
      throw new Error('受付期間外の申込はできません。');
    }

    const availableClassIds = new Set(reception.entryClasses.map((entryClass) => entryClass.id));
    if (!availableClassIds.has(selection.entryClassId)) {
      throw new Error('指定されたエントリークラスは受付対象外です。');
    }
  }
}

export default ParticipantEntryAcceptanceService;
