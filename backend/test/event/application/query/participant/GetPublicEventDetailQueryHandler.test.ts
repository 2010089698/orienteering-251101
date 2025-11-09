import GetPublicEventDetailQuery from '../../../../../src/event/application/query/participant/GetPublicEventDetailQuery';
import GetPublicEventDetailQueryHandler from '../../../../../src/event/application/query/participant/GetPublicEventDetailQueryHandler';
import type PublicEventDetailQueryRepository from '../../../../../src/event/application/port/out/PublicEventDetailQueryRepository';
import type PublicEventDetailResponseDto from '../../../../../src/event/application/query/participant/PublicEventDetailResponseDto';

describe('GetPublicEventDetailQueryHandler', () => {
  const repository: jest.Mocked<PublicEventDetailQueryRepository> = {
    findDetailByEventId: jest.fn()
  };

  const handler = new GetPublicEventDetailQueryHandler(repository);

  beforeEach(() => {
    repository.findDetailByEventId.mockReset();
  });

  it('公開イベント詳細を日付文字列に整形して返却する', async () => {
    const detail: PublicEventDetailResponseDto = {
      id: 'event-1',
      name: '公開イベント',
      startDate: new Date('2024-06-01T09:00:00.000Z'),
      endDate: new Date('2024-06-02T09:00:00.000Z'),
      isMultiDay: true,
      isMultiRace: false,
      raceSchedules: [
        { name: 'Day1', scheduledDate: new Date('2024-06-01T09:00:00.000Z') },
        { name: 'Day2', scheduledDate: new Date('2024-06-02T09:00:00.000Z') }
      ],
      entryReceptionStatus: 'OPEN',
      startListStatus: 'PUBLISHED',
      resultPublicationStatus: 'PUBLISHED'
    };
    repository.findDetailByEventId.mockResolvedValue(detail);

    const query = GetPublicEventDetailQuery.forEvent('event-1');

    await expect(handler.execute(query)).resolves.toEqual({
      eventId: 'event-1',
      eventName: '公開イベント',
      startDate: '2024-06-01',
      endDate: '2024-06-02',
      isMultiDayEvent: true,
      isMultiRaceEvent: false,
      raceSchedules: [
        { name: 'Day1', date: '2024-06-01' },
        { name: 'Day2', date: '2024-06-02' }
      ],
      entryReceptionStatus: 'OPEN',
      startListStatus: 'PUBLISHED',
      resultPublicationStatus: 'PUBLISHED'
    });
    expect(repository.findDetailByEventId).toHaveBeenCalledWith('event-1');
  });

  it('イベントが存在しない場合はエラーを送出する', async () => {
    repository.findDetailByEventId.mockResolvedValue(null);

    const query = GetPublicEventDetailQuery.forEvent('missing');

    await expect(handler.execute(query)).rejects.toThrow('指定されたイベントが見つかりませんでした。');
    expect(repository.findDetailByEventId).toHaveBeenCalledWith('missing');
  });
});
