import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import EventController from '../../../src/event/adapter/in/web/EventController';
import CreateEventUseCase from '../../../src/event/application/command/CreateEventUseCase';
import EventRepository from '../../../src/event/application/port/out/EventRepository';
import GetEventCreationDefaultsQueryHandler from '../../../src/event/application/query/GetEventCreationDefaultsQueryHandler';
import Event from '../../../src/event/domain/Event';

class InMemoryEventRepository implements EventRepository {
  public readonly events: Event[] = [];

  public async save(event: Event): Promise<void> {
    this.events.push(event);
  }
}

describe('EventController (E2E)', () => {
  const repository = new InMemoryEventRepository();
  const createEventUseCase = new CreateEventUseCase(repository);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const controller = new EventController(createEventUseCase, defaultsQueryHandler);

  const app = express();
  app.use(express.json());
  app.use(controller.router);

  beforeEach(() => {
    repository.events.length = 0;
  });

  it('POST /events 正常系: イベントが作成されレスポンスが返る', async () => {
    const response = await request(app)
      .post('/events')
      .send({
        organizerId: 'org-100',
        eventId: 'event-100',
        eventName: 'テスト大会',
        startDate: '2024-04-01',
        endDate: '2024-04-03',
        raceSchedules: [
          { name: '予選', date: '2024-04-01' },
          { name: '決勝', date: '2024-04-03' }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      eventId: 'event-100',
      eventName: 'テスト大会',
      startDate: '2024-04-01',
      endDate: '2024-04-03',
      isMultiDayEvent: true,
      isMultiRaceEvent: true,
      raceSchedules: [
        { name: '予選', date: '2024-04-01' },
        { name: '決勝', date: '2024-04-03' }
      ]
    });
    expect(repository.events).toHaveLength(1);
    expect(repository.events[0]?.organizerIdentifier).toBe('org-100');
  });

  it('POST /events 異常系: 終了日未指定で複数レースの場合はバリデーションエラー', async () => {
    const response = await request(app)
      .post('/events')
      .send({
        organizerId: 'org-101',
        eventId: 'event-101',
        eventName: 'エラー大会',
        startDate: '2024-04-01',
        raceSchedules: [
          { name: '予選', date: '2024-04-01' },
          { name: '決勝', date: '2024-04-02' }
        ]
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: '入力値が不正です。'
    });
    expect(response.body.errors).toContain('複数レースの場合はイベント終了日を指定してください。');
    expect(repository.events).toHaveLength(0);
  });

  it('GET /events/defaults 初期表示設定を返す', async () => {
    const response = await request(app).get('/events/defaults');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timezone: 'UTC',
      minRaceSchedules: 1,
      maxRaceSchedules: 10,
      requireEndDateForMultipleRaces: true
    });
  });
});
