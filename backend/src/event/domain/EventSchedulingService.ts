import EventPeriod from './EventPeriod';
import RaceSchedule from './RaceSchedule';

export interface SchedulingConsistencyResult {
  period: EventPeriod;
  isMultiDay: boolean;
  isMultiRace: boolean;
}

export class EventSchedulingService {
  public static ensureConsistency(
    basePeriod: EventPeriod,
    raceSchedules: ReadonlyArray<RaceSchedule>
  ): SchedulingConsistencyResult {
    if (raceSchedules.length === 0) {
      throw new Error('イベントには少なくとも1つのレース日程が必要です。');
    }

    const sortedSchedules = [...raceSchedules].sort(
      (left, right) => left.dayIdentifier - right.dayIdentifier
    );

    const distinctDayIdentifiers = new Set(sortedSchedules.map((schedule) => schedule.dayIdentifier));
    const earliestTimestamp = sortedSchedules[0].dayIdentifier;
    const latestTimestamp = sortedSchedules[sortedSchedules.length - 1].dayIdentifier;

    const isMultiRace = raceSchedules.length > 1;

    if (distinctDayIdentifiers.size === 1) {
      const singleDate = new Date(earliestTimestamp);
      return {
        period: EventPeriod.createSingleDay(singleDate),
        isMultiDay: false,
        isMultiRace
      };
    }

    let startBoundary = basePeriod.startDate;
    let endBoundary = basePeriod.endDate;

    if (startBoundary.getTime() > earliestTimestamp) {
      startBoundary = new Date(earliestTimestamp);
    }

    if (endBoundary.getTime() < latestTimestamp) {
      endBoundary = new Date(latestTimestamp);
    }

    const complementedPeriod = EventPeriod.createFromBoundaries(startBoundary, endBoundary);

    for (const schedule of raceSchedules) {
      if (!complementedPeriod.contains(schedule.date)) {
        throw new Error('レース日程がイベント期間外に設定されています。');
      }
    }

    return {
      period: complementedPeriod,
      isMultiDay: true,
      isMultiRace
    };
  }
}

export default EventSchedulingService;
