import StartListSettings from './StartListSettings';

interface ParticipantSlotProps {
  readonly participantEntryId: string;
  readonly participantName: string;
  readonly entryClassId: string;
  readonly laneNumber: number;
  readonly sequence: number;
  readonly settings: StartListSettings;
}

class ParticipantSlot {
  private constructor(
    private readonly entryId: string,
    private readonly name: string,
    private readonly classId: string,
    private readonly lane: number,
    private readonly scheduledAt: Date,
    private readonly order: number
  ) {}

  public static schedule(props: ParticipantSlotProps): ParticipantSlot {
    const participantEntryId = props.participantEntryId?.trim();
    if (!participantEntryId) {
      throw new Error('参加者エントリーIDを指定してください。');
    }

    const participantName = props.participantName?.trim();
    if (!participantName) {
      throw new Error('参加者名を指定してください。');
    }

    if (!props.entryClassId?.trim()) {
      throw new Error('参加者のクラスIDを指定してください。');
    }

    if (!Number.isInteger(props.laneNumber) || props.laneNumber <= 0) {
      throw new Error('レーン番号は1以上の整数で指定してください。');
    }

    if (props.laneNumber > props.settings.laneCount) {
      throw new Error('設定されたレーン数を超えて割り当てることはできません。');
    }

    if (!Number.isInteger(props.sequence) || props.sequence < 0) {
      throw new Error('走順のシーケンス番号が不正です。');
    }

    const startTime = props.settings.calculateStartTime(props.sequence);

    return new ParticipantSlot(
      participantEntryId,
      participantName,
      props.entryClassId,
      props.laneNumber,
      startTime,
      props.sequence
    );
  }

  public get participantEntryId(): string {
    return this.entryId;
  }

  public get participantName(): string {
    return this.name;
  }

  public get entryClassId(): string {
    return this.classId;
  }

  public get laneNumber(): number {
    return this.lane;
  }

  public get startTime(): Date {
    return new Date(this.scheduledAt.getTime());
  }

  public get sequence(): number {
    return this.order;
  }
}

export type { ParticipantSlotProps };
export default ParticipantSlot;
