import RegisterEntryReceptionCommand from '../../../src/entryReception/application/command/RegisterEntryReceptionCommand';
import RegisterEntryReceptionUseCase from '../../../src/entryReception/application/command/RegisterEntryReceptionUseCase';
import EntryReception from '../../../src/entryReception/domain/EntryReception';
import EventScheduleQueryRepository, {
  EventScheduleDetail
} from '../../../src/entryReception/application/port/out/EventScheduleQueryRepository';
import EntryReceptionRepository from '../../../src/entryReception/application/port/out/EntryReceptionRepository';

class InMemoryEntryReceptionRepository implements EntryReceptionRepository {
  public readonly saved: EntryReception[] = [];

  async save(entryReception: EntryReception): Promise<void> {
    this.saved.push(entryReception);
  }

  async findByEventId(eventId: string): Promise<ReadonlyArray<EntryReception>> {
    return this.saved.filter((entryReception) => entryReception.eventIdentifier === eventId);
  }
}

class StubEventScheduleQueryRepository implements EventScheduleQueryRepository {
  public detail: EventScheduleDetail | null = null;

  async findByEventId(eventId: string): Promise<EventScheduleDetail | null> {
    if (this.detail && this.detail.id === eventId) {
      return this.detail;
    }

    return null;
  }
}

describe('RegisterEntryReceptionUseCase', () => {
  const baseCommandProps = {
    eventId: 'event-1',
    raceId: 'race-1',
    receptionStart: '2024-05-02T09:00:00.000Z',
    receptionEnd: '2024-05-05T18:00:00.000Z',
    entryClasses: [
      { classId: 'class-1', name: '男子エリート', capacity: 50 },
      { classId: 'class-2', name: '女子エリート', capacity: 40 }
    ]
  } as const;

  function createUseCaseWithEvent(detail: EventScheduleDetail | null): {
    useCase: RegisterEntryReceptionUseCase;
    repository: InMemoryEntryReceptionRepository;
  } {
    const repository = new InMemoryEntryReceptionRepository();
    const queryRepository = new StubEventScheduleQueryRepository();
    queryRepository.detail = detail;

    return {
      useCase: new RegisterEntryReceptionUseCase(repository, queryRepository),
      repository
    };
  }

  it('イベント期間内でエントリー受付を登録できる', async () => {
    const eventDetail: EventScheduleDetail = {
      id: 'event-1',
      startDate: new Date('2024-05-01T00:00:00.000Z'),
      endDate: new Date('2024-05-10T00:00:00.000Z'),
      raceSchedules: [
        { id: 'race-1', scheduledDate: new Date('2024-05-06T00:00:00.000Z') }
      ]
    };
    const { useCase, repository } = createUseCaseWithEvent(eventDetail);
    const command = RegisterEntryReceptionCommand.from(baseCommandProps);

    const result = await useCase.execute(command);

    expect(result.eventIdentifier).toBe('event-1');
    expect(result.targetRaceId).toBe('race-1');
    expect(result.receptionWindow.opensAt.toISOString()).toBe(baseCommandProps.receptionStart);
    expect(result.receptionWindow.closesAt.toISOString()).toBe(baseCommandProps.receptionEnd);
    expect(result.entryClasses).toHaveLength(2);
    expect(repository.saved).toHaveLength(1);
  });

  it('イベントが存在しない場合はエラーになる', async () => {
    const { useCase } = createUseCaseWithEvent(null);
    const command = RegisterEntryReceptionCommand.from(baseCommandProps);

    await expect(useCase.execute(command)).rejects.toThrow('指定されたイベントが存在しません。');
  });

  it('指定したレースIDがイベントに存在しない場合はエラーになる', async () => {
    const eventDetail: EventScheduleDetail = {
      id: 'event-1',
      startDate: new Date('2024-05-01T00:00:00.000Z'),
      endDate: new Date('2024-05-10T00:00:00.000Z'),
      raceSchedules: [
        { id: 'race-2', scheduledDate: new Date('2024-05-06T00:00:00.000Z') }
      ]
    };
    const { useCase } = createUseCaseWithEvent(eventDetail);
    const command = RegisterEntryReceptionCommand.from(baseCommandProps);

    await expect(useCase.execute(command)).rejects.toThrow('指定されたレースIDはイベントに存在しません。');
  });

  it('受付期間がイベント期間外にある場合はエラーになる', async () => {
    const eventDetail: EventScheduleDetail = {
      id: 'event-1',
      startDate: new Date('2024-05-01T00:00:00.000Z'),
      endDate: new Date('2024-05-10T00:00:00.000Z'),
      raceSchedules: [
        { id: 'race-1', scheduledDate: new Date('2024-05-06T00:00:00.000Z') }
      ]
    };
    const { useCase } = createUseCaseWithEvent(eventDetail);
    const command = RegisterEntryReceptionCommand.from({
      ...baseCommandProps,
      receptionStart: '2024-04-25T09:00:00.000Z'
    });

    await expect(useCase.execute(command)).rejects.toThrow('受付期間はイベント期間内に設定してください。');
  });

  it('エントリークラスIDが重複している場合はエラーになる', async () => {
    const eventDetail: EventScheduleDetail = {
      id: 'event-1',
      startDate: new Date('2024-05-01T00:00:00.000Z'),
      endDate: new Date('2024-05-10T00:00:00.000Z'),
      raceSchedules: [
        { id: 'race-1', scheduledDate: new Date('2024-05-06T00:00:00.000Z') }
      ]
    };
    const { useCase } = createUseCaseWithEvent(eventDetail);
    const command = RegisterEntryReceptionCommand.from({
      ...baseCommandProps,
      entryClasses: [
        { classId: 'class-1', name: '男子エリート' },
        { classId: 'class-1', name: '女子エリート' }
      ]
    });

    await expect(useCase.execute(command)).rejects.toThrow('エントリークラスIDはレース内で一意でなければなりません。');
  });

  it('エントリークラスの定員が0以下の場合はエラーになる', async () => {
    const eventDetail: EventScheduleDetail = {
      id: 'event-1',
      startDate: new Date('2024-05-01T00:00:00.000Z'),
      endDate: new Date('2024-05-10T00:00:00.000Z'),
      raceSchedules: [
        { id: 'race-1', scheduledDate: new Date('2024-05-06T00:00:00.000Z') }
      ]
    };
    const { useCase } = createUseCaseWithEvent(eventDetail);
    const command = RegisterEntryReceptionCommand.from({
      ...baseCommandProps,
      entryClasses: [
        { classId: 'class-1', name: '男子エリート', capacity: 0 }
      ]
    });

    await expect(useCase.execute(command)).rejects.toThrow(
      'エントリークラスの定員は1以上の整数で指定してください。'
    );
  });
});
