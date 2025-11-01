import { CreateEventCommand } from '../../../src/event/application/command/CreateEventCommand';
import CreateEventUseCase from '../../../src/event/application/command/CreateEventUseCase';
import EventRepository from '../../../src/event/application/port/out/EventRepository';

describe('CreateEventUseCase', () => {
  const repository: jest.Mocked<EventRepository> = {
    save: jest.fn()
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('フォーム入力DTOからイベントを生成し永続化できる', async () => {
    repository.save.mockResolvedValue();
    const useCase = new CreateEventUseCase(repository);

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
  });

  it('不正な日付が含まれる場合は永続化せずにエラーを返す', async () => {
    repository.save.mockResolvedValue();
    const useCase = new CreateEventUseCase(repository);

    const command = CreateEventCommand.from({
      eventId: 'event-002',
      eventName: '秋季大会',
      startDate: 'invalid-date',
      raceSchedules: [{ name: '初日', date: '2024-10-01' }]
    });

    await expect(useCase.execute(command)).rejects.toThrow('イベント開始日の日付形式が正しくありません。');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
