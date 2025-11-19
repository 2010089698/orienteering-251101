import StartListSettings from './StartListSettings';

class LaneAssignment {
  private constructor(
    private readonly lane: number,
    private readonly classId: string
  ) {}

  public static assign(
    laneNumber: number,
    entryClassId: string,
    settings: StartListSettings
  ): LaneAssignment {
    if (!Number.isInteger(laneNumber) || laneNumber <= 0) {
      throw new Error('レーン番号は1以上の整数で指定してください。');
    }

    if (laneNumber > settings.laneCount) {
      throw new Error('レーン数の上限を超える割り当てはできません。');
    }

    const normalizedClassId = entryClassId?.trim();
    if (!normalizedClassId) {
      throw new Error('エントリークラスIDを指定してください。');
    }

    return new LaneAssignment(laneNumber, normalizedClassId);
  }

  public get laneNumber(): number {
    return this.lane;
  }

  public get entryClassId(): string {
    return this.classId;
  }
}

export default LaneAssignment;
