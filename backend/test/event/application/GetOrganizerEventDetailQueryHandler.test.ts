import EventDetailQueryRepository from '../../../src/event/application/port/out/EventDetailQueryRepository';
import GetOrganizerEventDetailQuery from '../../../src/event/application/query/GetOrganizerEventDetailQuery';
import GetOrganizerEventDetailQueryHandler from '../../../src/event/application/query/GetOrganizerEventDetailQueryHandler';
import type OrganizerEventDetailResponseDto from '../../../src/event/application/query/OrganizerEventDetailResponseDto';

describe('GetOrganizerEventDetailQueryHandler', () => {
  const repository: jest.Mocked<EventDetailQueryRepository> = {
    findDetailByEventId: jest.fn()
  };

  beforeEach(() => {
    repository.findDetailByEventId.mockReset();
  });

  it('イベント詳細を日付文字列に変換して返却する', async () => {
    const detail: OrganizerEventDetailResponseDto = {
      id: 'EVT-001',
      name: '春の大会',
      startDate: new Date('2024-04-01T10:00:00.000Z'),
      endDate: new Date('2024-04-02T10:00:00.000Z'),
      isMultiDay: true,
      isMultiRace: false,
      raceSchedules: [
        { name: 'Day1', scheduledDate: new Date('2024-04-01T10:00:00.000Z') },
        { name: 'Day2', scheduledDate: new Date('2024-04-02T10:00:00.000Z') }
      ],
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    };
    repository.findDetailByEventId.mockResolvedValue(detail);

    const handler = new GetOrganizerEventDetailQueryHandler(repository);
    const query = GetOrganizerEventDetailQuery.forEvent('EVT-001');

    const response = await handler.execute(query);

    expect(response).toEqual({
      eventId: 'EVT-001',
      eventName: '春の大会',
      startDate: '2024-04-01',
      endDate: '2024-04-02',
      isMultiDayEvent: true,
      isMultiRaceEvent: false,
      raceSchedules: [
        { name: 'Day1', date: '2024-04-01' },
        { name: 'Day2', date: '2024-04-02' }
      ],
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    });
  });

  it('イベントが見つからない場合はエラーを投げる', async () => {
    repository.findDetailByEventId.mockResolvedValue(null);
    const handler = new GetOrganizerEventDetailQueryHandler(repository);
    const query = GetOrganizerEventDetailQuery.forEvent('missing');

    await expect(handler.execute(query)).rejects.toThrow('指定されたイベントが見つかりませんでした。');
  });
});
