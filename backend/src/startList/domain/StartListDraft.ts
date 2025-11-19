import LaneAssignment from './LaneAssignment';
import ParticipantSlot from './ParticipantSlot';
import StartListSettings from './StartListSettings';

export interface ParticipantScheduleCandidate {
  readonly participantEntryId: string;
  readonly participantName: string;
  readonly entryClassId: string;
  readonly submittedAt: Date;
}

interface StartListDraftProps {
  readonly eventId: string;
  readonly raceId: string;
  readonly settings: StartListSettings;
  readonly laneAssignments?: ReadonlyArray<LaneAssignment>;
  readonly participantSlots?: ReadonlyArray<ParticipantSlot>;
  readonly finalized?: boolean;
}

class StartListDraft {
  private constructor(
    private readonly eventId: string,
    private readonly raceId: string,
    private readonly settings: StartListSettings,
    private readonly laneAssignments: ReadonlyArray<LaneAssignment>,
    private readonly slots: ReadonlyArray<ParticipantSlot>,
    private readonly finalized: boolean
  ) {}

  public static initialize(props: StartListDraftProps): StartListDraft {
    if (!props.eventId?.trim()) {
      throw new Error('イベントIDを指定してください。');
    }

    if (!props.raceId?.trim()) {
      throw new Error('レースIDを指定してください。');
    }

    if (!props.settings) {
      throw new Error('スタートリスト設定が存在しません。');
    }

    return new StartListDraft(
      props.eventId,
      props.raceId,
      props.settings,
      props.laneAssignments ?? [],
      props.participantSlots ?? [],
      props.finalized ?? false
    );
  }

  public static restore(props: StartListDraftProps): StartListDraft {
    return StartListDraft.initialize(props);
  }

  public reconfigure(settings: StartListSettings): StartListDraft {
    if (this.finalized) {
      throw new Error('公開済みのスタートリストは再設定できません。');
    }

    return new StartListDraft(this.eventId, this.raceId, settings, [], [], false);
  }

  public assignLanes(
    assignments: ReadonlyArray<{ laneNumber: number; entryClassId: string }>,
    availableClassIds: ReadonlySet<string>
  ): StartListDraft {
    if (this.finalized) {
      throw new Error('公開済みのスタートリストは更新できません。');
    }

    if (!assignments || assignments.length === 0) {
      throw new Error('レーン割り当てを1件以上指定してください。');
    }

    const laneAssignments = assignments.map((assignment) => {
      if (!availableClassIds.has(assignment.entryClassId)) {
        throw new Error('エントリー受付済みのクラスのみ割り当て可能です。');
      }
      return LaneAssignment.assign(assignment.laneNumber, assignment.entryClassId, this.settings);
    });

    const duplicateLane = this.detectDuplicateLane(laneAssignments);
    if (duplicateLane) {
      throw new Error(`レーン${duplicateLane}は重複して割り当てられています。`);
    }

    const classSet = new Set(laneAssignments.map((assignment) => assignment.entryClassId));
    if (classSet.size !== laneAssignments.length) {
      throw new Error('同一のエントリークラスを複数のレーンに割り当てることはできません。');
    }

    return new StartListDraft(this.eventId, this.raceId, this.settings, laneAssignments, [], false);
  }

  private detectDuplicateLane(assignments: ReadonlyArray<LaneAssignment>): number | null {
    const seen = new Set<number>();
    for (const assignment of assignments) {
      if (seen.has(assignment.laneNumber)) {
        return assignment.laneNumber;
      }
      seen.add(assignment.laneNumber);
    }
    return null;
  }

  public scheduleParticipants(
    candidates: ReadonlyArray<ParticipantScheduleCandidate>
  ): StartListDraft {
    if (this.finalized) {
      throw new Error('公開済みのスタートリストは編集できません。');
    }

    if (this.laneAssignments.length === 0) {
      throw new Error('レーン割り当てが完了していません。');
    }

    if (!candidates || candidates.length === 0) {
      throw new Error('参加者エントリーが存在しません。');
    }

    const assignmentsByClass = new Map<string, LaneAssignment>();
    for (const assignment of this.laneAssignments) {
      assignmentsByClass.set(assignment.entryClassId, assignment);
    }

    const participantQueues = new Map<number, ParticipantScheduleCandidate[]>();
    for (const candidate of candidates) {
      const assignment = assignmentsByClass.get(candidate.entryClassId);
      if (!assignment) {
        throw new Error('レーン割り当てされていないクラスの参加者が含まれています。');
      }
      const queue = participantQueues.get(assignment.laneNumber) ?? [];
      queue.push(candidate);
      participantQueues.set(assignment.laneNumber, queue);
    }

    for (const queue of participantQueues.values()) {
      queue.sort((left, right) => left.submittedAt.getTime() - right.submittedAt.getTime());
    }

    const orderedAssignments = [...this.laneAssignments].sort(
      (left, right) => left.laneNumber - right.laneNumber
    );

    const slots: ParticipantSlot[] = [];
    let sequence = 0;
    let hasRemaining = true;
    const unusedLaneCountPerWave = Math.max(
      this.settings.laneCount - orderedAssignments.length,
      0
    );

    while (hasRemaining) {
      hasRemaining = false;
      for (const assignment of orderedAssignments) {
        const queue = participantQueues.get(assignment.laneNumber) ?? [];
        const next = queue.shift();
        participantQueues.set(assignment.laneNumber, queue);
        if (!next) {
          continue;
        }
        hasRemaining = true;
        const slot = ParticipantSlot.schedule({
          participantEntryId: next.participantEntryId,
          participantName: next.participantName,
          entryClassId: next.entryClassId,
          laneNumber: assignment.laneNumber,
          sequence,
          settings: this.settings,
        });
        slots.push(slot);
        sequence += 1;
      }

      if (hasRemaining && unusedLaneCountPerWave > 0) {
        sequence += unusedLaneCountPerWave;
      }
    }

    if (slots.length === 0) {
      throw new Error('参加者スロットの生成に失敗しました。');
    }

    return new StartListDraft(
      this.eventId,
      this.raceId,
      this.settings,
      this.laneAssignments,
      slots,
      false
    );
  }

  public finalize(): StartListDraft {
    if (this.finalized) {
      throw new Error('スタートリストはすでに公開されています。');
    }

    if (this.slots.length === 0) {
      throw new Error('参加者スロットを編成してから公開してください。');
    }

    return new StartListDraft(
      this.eventId,
      this.raceId,
      this.settings,
      this.laneAssignments,
      this.slots,
      true
    );
  }

  public get eventIdentifier(): string {
    return this.eventId;
  }

  public get raceIdentifier(): string {
    return this.raceId;
  }

  public get startListSettings(): StartListSettings {
    return this.settings;
  }

  public get laneConfigurations(): ReadonlyArray<LaneAssignment> {
    return [...this.laneAssignments];
  }

  public get participantAssignments(): ReadonlyArray<ParticipantSlot> {
    return [...this.slots];
  }

  public get isFinalized(): boolean {
    return this.finalized;
  }

  public get status(): 'DRAFT' | 'PUBLISHED' {
    return this.finalized ? 'PUBLISHED' : 'DRAFT';
  }
}

export type { StartListDraftProps };
export default StartListDraft;
