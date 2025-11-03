import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import PublicEventController from '../../../src/event/adapter/in/web/PublicEventController';
import ListPublicEventsQueryHandler from '../../../src/event/application/query/participant/ListPublicEventsQueryHandler';
import PublicEventListQueryRepository from '../../../src/event/application/port/out/PublicEventListQueryRepository';
import EventSummaryResponseDto from '../../../src/event/application/query/EventSummaryResponseDto';
import PublicEventSearchCondition from '../../../src/event/application/query/participant/PublicEventSearchCondition';

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
  const controller = new PublicEventController(handler);

  const app = express();
  app.use(express.json());
  app.use(controller.router);

  beforeEach(() => {
    repository.summaries = [];
    repository.receivedConditions = [];
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
});
