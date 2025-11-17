import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import PublicEventController from '../../../src/event/adapter/in/web/PublicEventController';
import ListPublicEventsQueryHandler from '../../../src/event/application/query/participant/ListPublicEventsQueryHandler';
import GetPublicEventDetailQueryHandler from '../../../src/event/application/query/participant/GetPublicEventDetailQueryHandler';
import PublicEventListQueryRepository from '../../../src/event/application/port/out/PublicEventListQueryRepository';
import EventSummaryResponseDto from '../../../src/event/application/query/EventSummaryResponseDto';
import PublicEventSearchCondition from '../../../src/event/application/query/participant/PublicEventSearchCondition';
import GetParticipantEntryOptionsQueryHandler from '../../../src/participantEntry/application/query/GetParticipantEntryOptionsQueryHandler';
import SubmitParticipantEntryCommandHandler from '../../../src/participantEntry/application/command/SubmitParticipantEntryCommandHandler';

class InMemoryPublicEventListQueryRepository
  implements PublicEventListQueryRepository
{
  public summaries: EventSummaryResponseDto[] = [];

  public receivedConditions: PublicEventSearchCondition[] = [];

  public async findPublicSummaries(
    condition: PublicEventSearchCondition
  ): Promise<ReadonlyArray<EventSummaryResponseDto>> {
    this.receivedConditions.push(condition);
    return [...this.summaries];
  }
}

describe('PublicEventController (E2E)', () => {
  const repository = new InMemoryPublicEventListQueryRepository();
  const handler = new ListPublicEventsQueryHandler(repository);
  const detailHandlerMock: Pick<GetPublicEventDetailQueryHandler, 'execute'> = {
    execute: jest.fn()
  };
  const entryOptionsHandlerMock: Pick<GetParticipantEntryOptionsQueryHandler, 'execute'> = {
    execute: jest.fn()
  };
  const submitEntryHandlerMock: Pick<SubmitParticipantEntryCommandHandler, 'execute'> = {
    execute: jest.fn()
  };
  const controller = new PublicEventController(
    handler,
    detailHandlerMock as unknown as GetPublicEventDetailQueryHandler,
    entryOptionsHandlerMock as unknown as GetParticipantEntryOptionsQueryHandler,
    submitEntryHandlerMock as unknown as SubmitParticipantEntryCommandHandler
  );

  const app = express();
  app.use(express.json());
  app.use(controller.router);

  beforeEach(() => {
    repository.summaries = [];
    repository.receivedConditions = [];
    (detailHandlerMock.execute as jest.Mock).mockReset();
    (entryOptionsHandlerMock.execute as jest.Mock).mockReset();
    (submitEntryHandlerMock.execute as jest.Mock).mockReset();
  });

  it('GET /public/events 正常系: 公開イベントの一覧を返す', async () => {
    repository.summaries = [
      {
        id: 'event-1',
        name: '公開イベント1',
        startDate: '2024-06-01T09:00:00.000Z',
        endDate: '2024-06-01T12:00:00.000Z',
        isMultiDay: false,
        isMultiRace: false
      },
      {
        id: 'event-2',
        name: '公開イベント2',
        startDate: '2024-06-05T09:00:00.000Z',
        endDate: '2024-06-06T12:00:00.000Z',
        isMultiDay: true,
        isMultiRace: true
      }
    ];

    const response = await request(app).get('/public/events');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        eventId: 'event-1',
        eventName: '公開イベント1',
        startDate: '2024-06-01',
        endDate: '2024-06-01',
        isMultiDayEvent: false,
        isMultiRaceEvent: false
      },
      {
        eventId: 'event-2',
        eventName: '公開イベント2',
        startDate: '2024-06-05',
        endDate: '2024-06-06',
        isMultiDayEvent: true,
        isMultiRaceEvent: true
      }
    ]);
    expect(repository.receivedConditions).toHaveLength(1);
  });

  it('GET /public/events/:eventId 正常系: 受付期間が開いている場合に OPEN を返す', async () => {
    (detailHandlerMock.execute as jest.Mock).mockResolvedValue({
      eventId: 'event-1',
      eventName: '公開イベント1',
      startDate: '2024-06-01',
      endDate: '2024-06-01',
      isMultiDayEvent: false,
      isMultiRaceEvent: false,
      raceSchedules: [{ name: 'DAY1', date: '2024-06-01' }],
      entryReceptionStatus: 'OPEN',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    });

    const response = await request(app).get('/public/events/event-1');

    expect(response.status).toBe(200);
    expect(response.body.entryReceptionStatus).toBe('OPEN');
  });

  it('GET /public/events 正常系: クエリパラメータから検索条件を構築する', async () => {
    const response = await request(app)
      .get('/public/events')
      .query({ from: '2024-06-01', to: '2024-06-30', status: 'upcoming,ongoing' });

    expect(response.status).toBe(200);
    expect(repository.receivedConditions).toHaveLength(1);
    const [condition] = repository.receivedConditions;
    expect(Array.from(condition.statuses)).toEqual(['upcoming', 'ongoing']);
    expect(condition.startDateFrom?.toISOString()).toBe('2024-06-01T00:00:00.000Z');
    expect(condition.startDateTo?.toISOString()).toBe('2024-06-30T00:00:00.000Z');
  });

  it('GET /public/events 異常系: 日付形式が不正な場合はバリデーションエラー', async () => {
    const response = await request(app).get('/public/events').query({ from: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: '入力値が不正です。' });
    expect(response.body.errors).toContain('from はISO8601形式で指定してください。');
  });

  it('GET /public/events 異常系: 日付範囲が矛盾する場合は400を返す', async () => {
    const response = await request(app)
      .get('/public/events')
      .query({ from: '2024-07-10', to: '2024-07-01' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: 'イベント開始日の検索範囲が不正です。'
    });
  });

  it('GET /public/events/:eventId/entry-options 正常系: 指定レースの受付情報を返す', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-05T00:00:00.000Z'));
    try {
      (detailHandlerMock.execute as jest.Mock).mockResolvedValue({
        eventId: 'event-1',
        eventName: '公開イベント1',
        startDate: '2024-06-01',
        endDate: '2024-06-01',
        isMultiDayEvent: false,
        isMultiRaceEvent: false,
        raceSchedules: [
          { name: 'race-1', date: '2024-06-01' }
        ],
        entryReceptionStatus: 'NOT_REGISTERED',
        startListStatus: 'NOT_CREATED',
        resultPublicationStatus: 'NOT_PUBLISHED'
      });
      (entryOptionsHandlerMock.execute as jest.Mock).mockResolvedValue({
        eventId: 'event-1',
        raceId: 'race-1',
        receptionWindow: {
          opensAt: new Date('2024-05-01T00:00:00.000Z'),
          closesAt: new Date('2024-05-10T00:00:00.000Z')
        },
        entryClasses: [
          { id: 'class-1', name: 'クラス1' },
          { id: 'class-2', name: 'クラス2' }
        ]
      });

      const response = await request(app)
        .get('/public/events/event-1/entry-options')
        .query({ raceId: 'race-1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        eventId: 'event-1',
        eventName: '公開イベント1',
        entryReceptionStatus: 'OPEN',
        races: [
          {
            raceId: 'race-1',
            raceName: 'race-1',
            raceDate: '2024-06-01',
            receptionStart: '2024-05-01T00:00:00.000Z',
            receptionEnd: '2024-05-10T00:00:00.000Z',
            entryClasses: [
              { classId: 'class-1', name: 'クラス1' },
              { classId: 'class-2', name: 'クラス2' }
            ]
          }
        ]
      });
      expect(detailHandlerMock.execute).toHaveBeenCalled();
      expect(entryOptionsHandlerMock.execute).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('GET /public/events/:eventId/entry-options 異常系: レースIDが未指定の場合は400を返す', async () => {
    const response = await request(app).get('/public/events/event-1/entry-options');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: '入力値が不正です。' });
    expect(response.body.errors).toContain('レースIDは必須です。');
    expect(entryOptionsHandlerMock.execute).not.toHaveBeenCalled();
  });

  it('GET /public/events/:eventId/entry-options 異常系: 受付情報が無い場合は404を返す', async () => {
    (detailHandlerMock.execute as jest.Mock).mockResolvedValue({
      eventId: 'event-1',
      eventName: '公開イベント1',
      startDate: '2024-06-01',
      endDate: '2024-06-01',
      isMultiDayEvent: false,
      isMultiRaceEvent: false,
      raceSchedules: [],
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    });
    (entryOptionsHandlerMock.execute as jest.Mock).mockRejectedValue(
      new Error('指定されたレースの受付情報が見つかりません。')
    );

    const response = await request(app)
      .get('/public/events/event-1/entry-options')
      .query({ raceId: 'race-1' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: '指定されたレースの受付情報が見つかりません。'
    });
  });

  it('POST /public/events/:eventId/entries 正常系: 参加者エントリーを受け付ける', async () => {
    (submitEntryHandlerMock.execute as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/public/events/event-1/entries')
      .send({
        eventId: 'event-1',
        raceId: 'race-1',
        classId: 'class-1',
        participant: {
          name: '参加者 太郎',
          email: 'taro@example.com'
        }
      });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ message: 'エントリーを受け付けました。' });
    expect(submitEntryHandlerMock.execute).toHaveBeenCalled();
  });

  it('POST /public/events/:eventId/entries 異常系: バリデーションエラーを集約する', async () => {
    const response = await request(app)
      .post('/public/events/event-1/entries')
      .send({
        eventId: 'event-1',
        classId: 'class-1',
        participant: {
          name: '',
          email: 'invalid-email'
        }
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: '入力値が不正です。' });
    expect(response.body.errors).toContain('レースIDは必須です。');
    expect(response.body.errors).toContain('参加者氏名は必須です。');
    expect(response.body.errors).toContain(
      '連絡先メールアドレスはメールアドレス形式で指定してください。'
    );
    expect(submitEntryHandlerMock.execute).not.toHaveBeenCalled();
  });

  it('POST /public/events/:eventId/entries 異常系: 受付対象外のレースは404を返す', async () => {
    (submitEntryHandlerMock.execute as jest.Mock).mockRejectedValue(
      new Error('指定されたレースでは参加者受付を実施していません。')
    );

    const response = await request(app)
      .post('/public/events/event-1/entries')
      .send({
        eventId: 'event-1',
        raceId: 'race-1',
        classId: 'class-1',
        participant: {
          name: '参加者 太郎',
          email: 'taro@example.com'
        }
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: '指定されたレースでは参加者受付を実施していません。'
    });
  });
});
