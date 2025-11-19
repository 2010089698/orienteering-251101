class StartListSettings {
  private constructor(
    private readonly startAt: Date,
    private readonly intervalSeconds: number,
    private readonly totalLanes: number
  ) {}

  public static configure(
    startAt: Date,
    intervalSeconds: number,
    totalLanes: number
  ): StartListSettings {
    if (!startAt || Number.isNaN(startAt.getTime())) {
      throw new Error('スタートリストの開始日時が不正です。');
    }

    if (!Number.isInteger(intervalSeconds) || intervalSeconds <= 0) {
      throw new Error('スタート間隔（秒）は正の整数で指定してください。');
    }

    if (!Number.isInteger(totalLanes) || totalLanes <= 0) {
      throw new Error('レーン数は1以上の整数で指定してください。');
    }

    return new StartListSettings(new Date(startAt.getTime()), intervalSeconds, totalLanes);
  }

  public get startTime(): Date {
    return new Date(this.startAt.getTime());
  }

  public get intervalInSeconds(): number {
    return this.intervalSeconds;
  }

  public get laneCount(): number {
    return this.totalLanes;
  }

  public calculateStartTime(sequence: number): Date {
    if (!Number.isInteger(sequence) || sequence < 0) {
      throw new Error('走順シーケンスが不正です。');
    }

    const waveIndex = Math.floor(sequence / this.totalLanes);
    const startTime = new Date(this.startAt.getTime());
    startTime.setSeconds(startTime.getSeconds() + waveIndex * this.intervalSeconds);
    return startTime;
  }
}

export default StartListSettings;
