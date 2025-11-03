import Event from '../../../src/event/domain/Event';
import EventPeriod from '../../../src/event/domain/EventPeriod';
import EventSchedulingService from '../../../src/event/domain/EventSchedulingService';
import RaceSchedule from '../../../src/event/domain/RaceSchedule';

describe('EventPeriod', () => {
  it('単日の値オブジェクトを生成できる', () => {
    const period = EventPeriod.createSingleDay(new Date('2024-04-10'));

    expect(period.isSingleDay).toBe(true);
    expect(period.startDate.toISOString()).toBe('2024-04-10T00:00:00.000Z');
    expect(period.endDate.toISOString()).toBe('2024-04-10T00:00:00.000Z');
  });

  it('複数日の値オブジェクトを生成できる', () => {
    const period = EventPeriod.createMultiDay(new Date('2024-04-10'), new Date('2024-04-12'));

    expect(period.isSingleDay).toBe(false);
    expect(period.startDate.toISOString()).toBe('2024-04-10T00:00:00.000Z');
    expect(period.endDate.toISOString()).toBe('2024-04-12T00:00:00.000Z');
  });

  it('開始日より前の終了日は拒否する', () => {
    expect(() =>
      EventPeriod.createMultiDay(new Date('2024-04-10'), new Date('2024-04-09'))
    ).toThrow('イベント期間の終了日は開始日以降でなければなりません。');
  });
});

describe('RaceSchedule', () => {
  it('レース名と日付からスケジュールを生成できる', () => {
    const schedule = RaceSchedule.create(' Sprint ', new Date('2024-04-10'));

    expect(schedule.name).toBe('Sprint');
    expect(schedule.date.toISOString()).toBe('2024-04-10T00:00:00.000Z');
  });

  it('レース名は必須', () => {
    expect(() => RaceSchedule.create('  ', new Date('2024-04-10'))).toThrow(
      'レース名を指定してください。'
    );
  });
});

describe('EventSchedulingService', () => {
  it('複数日のレースを期間に合わせて補完する', () => {
    const basePeriod = EventPeriod.createMultiDay(new Date('2024-04-10'), new Date('2024-04-11'));
    const day1 = RaceSchedule.create('Sprint', new Date('2024-04-10'));
    const day3 = RaceSchedule.create('Relay', new Date('2024-04-12'));

    const result = EventSchedulingService.ensureConsistency(basePeriod, [day1, day3]);

    expect(result.isMultiDay).toBe(true);
    expect(result.period.startDate.toISOString()).toBe('2024-04-10T00:00:00.000Z');
    expect(result.period.endDate.toISOString()).toBe('2024-04-12T00:00:00.000Z');
  });

  it('単日のレースでは単日として補正する', () => {
    const basePeriod = EventPeriod.createMultiDay(new Date('2024-04-10'), new Date('2024-04-12'));
    const day1 = RaceSchedule.create('Sprint', new Date('2024-04-11'));

    const result = EventSchedulingService.ensureConsistency(basePeriod, [day1]);

    expect(result.isMultiDay).toBe(false);
    expect(result.period.isSingleDay).toBe(true);
    expect(result.period.startDate.toISOString()).toBe('2024-04-11T00:00:00.000Z');
  });

  it('レース日程が存在しない場合は例外を投げる', () => {
    const basePeriod = EventPeriod.createSingleDay(new Date('2024-04-10'));

    expect(() => EventSchedulingService.ensureConsistency(basePeriod, [])).toThrow(
      'イベントには少なくとも1つのレース日程が必要です。'
    );
  });
});

describe('Event', () => {
  it('単日・単一レースのイベントを生成できる', () => {
    const period = EventPeriod.createSingleDay(new Date('2024-04-10'));
    const schedule = RaceSchedule.create('Sprint', new Date('2024-04-10'));

    const event = Event.create({
      id: 'evt-1',
      name: 'Spring Cup',
      period,
      raceSchedules: [schedule]
    });

    expect(event.eventIdentifier).toBe('evt-1');
    expect(event.displayName).toBe('Spring Cup');
    expect(event.isMultiDayEvent).toBe(false);
    expect(event.isMultiRaceEvent).toBe(false);
    expect(event.eventDuration.isSingleDay).toBe(true);
    expect(event.raceSchedules).toHaveLength(1);
  });

  it('複数日・複数レースのイベントを生成できる', () => {
    const basePeriod = EventPeriod.createSingleDay(new Date('2024-04-10'));
    const scheduleDay1 = RaceSchedule.create('Sprint', new Date('2024-04-10'));
    const scheduleDay3 = RaceSchedule.create('Relay', new Date('2024-04-12'));

    const event = Event.create({
      id: 'evt-2',
      name: 'Spring Festival',
      period: basePeriod,
      raceSchedules: [scheduleDay1, scheduleDay3]
    });

    expect(event.isMultiDayEvent).toBe(true);
    expect(event.isMultiRaceEvent).toBe(true);
    expect(event.eventDuration.startDate.toISOString()).toBe('2024-04-10T00:00:00.000Z');
    expect(event.eventDuration.endDate.toISOString()).toBe('2024-04-12T00:00:00.000Z');
  });

  it('レース名の重複は許可しない', () => {
    const period = EventPeriod.createSingleDay(new Date('2024-04-10'));
    const schedule1 = RaceSchedule.create('Sprint', new Date('2024-04-10'));
    const schedule2 = RaceSchedule.create('Sprint', new Date('2024-04-11'));

    expect(() =>
      Event.create({
        id: 'evt-3',
        name: 'Duplicated Race',
        period,
        raceSchedules: [schedule1, schedule2]
      })
    ).toThrow('レース名はイベント内で一意でなければなりません。');
  });

  it('IDと名称は必須', () => {
    const period = EventPeriod.createSingleDay(new Date('2024-04-10'));
    const schedule = RaceSchedule.create('Sprint', new Date('2024-04-10'));

    expect(() =>
      Event.create({
        id: '  ',
        name: 'Valid',
        period,
        raceSchedules: [schedule]
      })
    ).toThrow('イベントIDを指定してください。');

    expect(() =>
      Event.create({
        id: 'evt-4',
        name: '',
        period,
        raceSchedules: [schedule]
      })
    ).toThrow('イベント名を指定してください。');
  });

  it('公開状態を遷移できる', () => {
    const period = EventPeriod.createSingleDay(new Date('2024-09-01'));
    const schedule = RaceSchedule.create('Sprint', new Date('2024-09-01'));

    const event = Event.create({
      id: 'evt-5',
      name: 'Autumn Cup',
      period,
      raceSchedules: [schedule]
    });

    expect(event.isPublic).toBe(false);

    event.publish();
    expect(event.isPublic).toBe(true);

    expect(() => event.publish()).toThrow('イベントは既に公開されています。');

    event.unpublish();
    expect(event.isPublic).toBe(false);
    expect(() => event.unpublish()).toThrow('イベントはまだ公開されていません。');
  });
});
