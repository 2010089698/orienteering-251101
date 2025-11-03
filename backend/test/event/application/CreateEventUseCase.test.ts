import { CreateEventCommand } from '../../../src/event/application/command/CreateEventCommand';
import CreateEventUseCase from '../../../src/event/application/command/CreateEventUseCase';
import PublishEventUseCase from '../../../src/event/application/command/PublishEventUseCase';
import EventRepository from '../../../src/event/application/port/out/EventRepository';
import Event from '../../../src/event/domain/Event';
import EventPeriod from '../../../src/event/domain/EventPeriod';
import RaceSchedule from '../../../src/event/domain/RaceSchedule';

describe('CreateEventUseCase', () => {
  const repository: jest.Mocked<EventRepository> = {
    save: jest.fn(),
    findById: jest.fn()
  };
  const publishExecuteMock = jest.fn();
  const publishUseCase = {
    execute: publishExecuteMock
  } as unknown as PublishEventUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    publishExecuteMock.mockReset();
  });

  it('フォーム入力DTOからイベントを生成し永続化できる', async () => {
    repository.save.mockResolvedValue();
    const useCase = new CreateEventUseCase(repository, publishUseCase);

    const command = CreateEventCommand.from({
      eventId: 'event-001',
      eventName: '春季オリエンテーリング',
      startDate: '2024-04-01',
      endDate: '2024-04-03',
      raceSchedules: [
        { name: '開幕スプリント', date: '2024-04-01' },
        { name: '決勝ロング', date: '2024-04-03' }
      ]
    });

    const event = await useCase.execute(command);

    expect(event.eventIdentifier).toBe('event-001');
    expect(event.displayName).toBe('春季オリエンテーリング');
    expect(event.isMultiDayEvent).toBe(true);
    expect(event.isMultiRaceEvent).toBe(true);
    expect(event.raceSchedules).toHaveLength(2);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(event);
    expect(publishExecuteMock).not.toHaveBeenCalled();
  });

  it('不正な日付が含まれる場合は永続化せずにエラーを返す', async () => {
    repository.save.mockResolvedValue();
    const useCase = new CreateEventUseCase(repository, publishUseCase);

    const command = CreateEventCommand.from({
      eventId: 'event-002',
      eventName: '秋季大会',
      startDate: 'invalid-date',
      raceSchedules: [{ name: '初日', date: '2024-10-01' }]
    });

    await expect(useCase.execute(command)).rejects.toThrow('イベント開始日の日付形式が正しくありません。');
    expect(repository.save).not.toHaveBeenCalled();
    expect(publishExecuteMock).not.toHaveBeenCalled();
  });

  it('即時公開フラグが指定された場合は公開ユースケースを呼び出す', async () => {
    repository.save.mockResolvedValue();
    const useCase = new CreateEventUseCase(repository, publishUseCase);
    const baseEvent = CreateEventCommand.from({
      eventId: 'event-003',
      eventName: '夏季大会',
      startDate: '2024-08-01',
      endDate: '2024-08-02',
      raceSchedules: [
        { name: '初日', date: '2024-08-01' },
        { name: '二日目', date: '2024-08-02' }
      ],
      publishImmediately: true
    });

    const publishedDomainEvent = Event.create({
      id: 'event-003',
      name: '夏季大会',
      period: EventPeriod.createFromBoundaries(new Date('2024-08-01'), new Date('2024-08-02')),
      raceSchedules: [
        RaceSchedule.create('初日', new Date('2024-08-01')),
        RaceSchedule.create('二日目', new Date('2024-08-02'))
      ]
    });
    publishedDomainEvent.publish();
    publishExecuteMock.mockResolvedValue(publishedDomainEvent);

    const publishedEvent = await useCase.execute(baseEvent);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(publishExecuteMock).toHaveBeenCalledTimes(1);
    const publishCommand = publishExecuteMock.mock.calls[0][0];
    expect(publishCommand.eventId).toBe('event-003');
    expect(publishedEvent.isPublic).toBe(true);
  });
});
