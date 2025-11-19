import StartListDraft, { ParticipantScheduleCandidate } from '../../domain/StartListDraft';
import ParticipantEntriesForStartListQuery from '../port/out/ParticipantEntriesForStartListQuery';
import StartListRepository from '../port/out/StartListRepository';
import ScheduleParticipantsCommand from './ScheduleParticipantsCommand';

class ScheduleParticipantsUseCase {
  public constructor(
    private readonly repository: StartListRepository,
    private readonly participantQuery: ParticipantEntriesForStartListQuery
  ) {}

  public async execute(command: ScheduleParticipantsCommand): Promise<StartListDraft> {
    const draft = await this.repository.findByEventAndRace(command.eventId, command.raceId);
    if (!draft) {
      throw new Error('スタートリストが未設定です。先に基本設定を完了してください。');
    }

    const participants = await this.participantQuery.listByRace(
      command.eventId,
      command.raceId
    );

    const candidates: ParticipantScheduleCandidate[] = participants.map((participant) => ({
      participantEntryId: participant.entryId,
      participantName: participant.participantName,
      entryClassId: participant.entryClassId,
      submittedAt: participant.submittedAt,
    }));

    const updated = draft.scheduleParticipants(candidates);
    await this.repository.save(updated);
    return updated;
  }
}

export default ScheduleParticipantsUseCase;
