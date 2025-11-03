import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import EventController from '../../../src/event/adapter/in/web/EventController';
import CreateEventUseCase from '../../../src/event/application/command/CreateEventUseCase';
import EventRepository from '../../../src/event/application/port/out/EventRepository';
import GetEventCreationDefaultsQueryHandler from '../../../src/event/application/query/GetEventCreationDefaultsQueryHandler';
import EventListQueryRepository from '../../../src/event/application/port/out/EventListQueryRepository';
import ListOrganizerEventsQueryHandler from '../../../src/event/application/query/ListOrganizerEventsQueryHandler';
import EventSummaryResponseDto from '../../../src/event/application/query/EventSummaryResponseDto';
import EventDetailQueryRepository from '../../../src/event/application/port/out/EventDetailQueryRepository';
import GetOrganizerEventDetailQueryHandler from '../../../src/event/application/query/GetOrganizerEventDetailQueryHandler';
import type OrganizerEventDetailResponseDto from '../../../src/event/application/query/OrganizerEventDetailResponseDto';
import Event from '../../../src/event/domain/Event';

class InMemoryEventRepository implements EventRepository {
  public readonly events: Event[] = [];

  public async save(event: Event): Promise<void> {
    this.events.push(event);
  }
}

class InMemoryEventListQueryRepository implements EventListQueryRepository {
  public events: EventSummaryResponseDto[] = [];

  public requestedOrganizerIds: string[] = [];

  public async findSummariesByOrganizerId(
    organizerId: string
  ): Promise<ReadonlyArray<EventSummaryResponseDto>> {
    this.requestedOrganizerIds.push(organizerId);
    return [...this.events];
  }
}

class InMemoryEventDetailQueryRepository implements EventDetailQueryRepository {
  public details = new Map<string, OrganizerEventDetailResponseDto>();

  public async findDetailByEventId(
    eventId: string
  ): Promise<OrganizerEventDetailResponseDto | null> {
    return this.details.get(eventId) ?? null;
  }
}

describe('EventController (E2E)', () => {
  const repository = new InMemoryEventRepository();
  const createEventUseCase = new CreateEventUseCase(repository);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const eventListQueryRepository = new InMemoryEventListQueryRepository();
  const listEventsQueryHandler = new ListOrganizerEventsQueryHandler(eventListQueryRepository);
  const eventDetailQueryRepository = new InMemoryEventDetailQueryRepository();
  const eventDetailQueryHandler = new GetOrganizerEventDetailQueryHandler(eventDetailQueryRepository);
  const controller = new EventController(
    createEventUseCase,
    defaultsQueryHandler,
    listEventsQueryHandler,
    eventDetailQueryHandler
  );

  const app = express();
  app.use(express.json());
  app.use(controller.router);

  beforeEach(() => {
    repository.events.length = 0;
    eventListQueryRepository.events = [];
    eventListQueryRepository.requestedOrganizerIds = [];
    eventDetailQueryRepository.details.clear();
  });

  it('POST /events 正常系: イベントが作成されレスポンスが返る', async () => {
    const response = await request(app)
      .post('/events')
      .send({
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
  });

  it('POST /events 異常系: 終了日未指定で複数レースの場合はバリデーションエラー', async () => {
    const response = await request(app)
      .post('/events')
      .send({
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

  it('GET /events 正常系: イベント一覧を開催日フォーマットで返す', async () => {
    eventListQueryRepository.events = [
      {
        id: 'event-201',
        name: 'イベントA',
        startDate: '2024-05-02T09:00:00.000Z',
        endDate: '2024-05-03T09:00:00.000Z',
        isMultiDay: true,
        isMultiRace: false
      },
      {
        id: 'event-200',
        name: 'イベントB',
        startDate: '2024-04-01T00:00:00.000Z',
        endDate: '2024-04-01T00:00:00.000Z',
        isMultiDay: false,
        isMultiRace: false
      }
    ];

    const response = await request(app).get('/events').query({ organizerId: 'organizer-001' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        eventId: 'event-201',
        eventName: 'イベントA',
        startDate: '2024-05-02',
        endDate: '2024-05-03',
        isMultiDayEvent: true,
        isMultiRaceEvent: false
      },
      {
        eventId: 'event-200',
        eventName: 'イベントB',
        startDate: '2024-04-01',
        endDate: '2024-04-01',
        isMultiDayEvent: false,
        isMultiRaceEvent: false
      }
    ]);
    expect(eventListQueryRepository.requestedOrganizerIds).toEqual(['organizer-001']);
  });

  it('GET /events 正常系: イベントが存在しない場合は空配列を返す', async () => {
    eventListQueryRepository.events = [];

    const response = await request(app).get('/events').query({ organizerId: 'organizer-002' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(eventListQueryRepository.requestedOrganizerIds).toEqual(['organizer-002']);
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
