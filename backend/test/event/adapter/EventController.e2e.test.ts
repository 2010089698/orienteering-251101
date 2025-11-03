import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import EventController from '../../../src/event/adapter/in/web/EventController';
import CreateEventUseCase from '../../../src/event/application/command/CreateEventUseCase';
import PublishEventUseCase from '../../../src/event/application/command/PublishEventUseCase';
import EventRepository from '../../../src/event/application/port/out/EventRepository';
import GetEventCreationDefaultsQueryHandler from '../../../src/event/application/query/GetEventCreationDefaultsQueryHandler';
import EventListQueryRepository from '../../../src/event/application/port/out/EventListQueryRepository';
import ListOrganizerEventsQueryHandler from '../../../src/event/application/query/ListOrganizerEventsQueryHandler';
import EventSummaryResponseDto from '../../../src/event/application/query/EventSummaryResponseDto';
import EventDetailQueryRepository from '../../../src/event/application/port/out/EventDetailQueryRepository';
import GetOrganizerEventDetailQueryHandler from '../../../src/event/application/query/GetOrganizerEventDetailQueryHandler';
import type OrganizerEventDetailResponseDto from '../../../src/event/application/query/OrganizerEventDetailResponseDto';
import Event from '../../../src/event/domain/Event';
import PublicEventSearchCondition from '../../../src/event/application/query/participant/PublicEventSearchCondition';
import TypeOrmPublicEventListQueryRepository from '../../../src/event/infrastructure/repository/TypeOrmPublicEventListQueryRepository';
import { createAppWithDependencies } from '../../../src/app';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

class InMemoryEventRepository implements EventRepository {
  public readonly events: Event[] = [];

  public async findById(eventId: string): Promise<Event | null> {
    return this.events.find((event) => event.eventIdentifier === eventId) ?? null;
  }

  public async save(event: Event): Promise<void> {
    const index = this.events.findIndex((stored) => stored.eventIdentifier === event.eventIdentifier);
    if (index >= 0) {
      this.events[index] = event;
      return;
    }

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
  const publishEventUseCase = new PublishEventUseCase(repository);
  const createEventUseCase = new CreateEventUseCase(repository, publishEventUseCase);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const eventListQueryRepository = new InMemoryEventListQueryRepository();
  const listEventsQueryHandler = new ListOrganizerEventsQueryHandler(eventListQueryRepository);
  const eventDetailQueryRepository = new InMemoryEventDetailQueryRepository();
  const eventDetailQueryHandler = new GetOrganizerEventDetailQueryHandler(eventDetailQueryRepository);
  const controller = new EventController(
    createEventUseCase,
    defaultsQueryHandler,
    listEventsQueryHandler,
    eventDetailQueryHandler,
    publishEventUseCase
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
      isPublic: false,
      raceSchedules: [
        { name: '予選', date: '2024-04-01' },
        { name: '決勝', date: '2024-04-03' }
      ]
    });
    expect(repository.events).toHaveLength(1);
  });

  it('POST /events 正常系: 即時公開指定で公開済みとして返却される', async () => {
    const response = await request(app)
      .post('/events')
      .send({
        eventId: 'event-102',
        eventName: '即時公開大会',
        startDate: '2024-05-01',
        endDate: '2024-05-02',
        publishImmediately: true,
        raceSchedules: [
          { name: '初日', date: '2024-05-01' },
          { name: '二日目', date: '2024-05-02' }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      eventId: 'event-102',
      isPublic: true
    });

    const stored = repository.events.find((event) => event.eventIdentifier === 'event-102');
    expect(stored).toBeDefined();
    expect(stored?.isPublic).toBe(true);
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

  it('POST /events/:eventId/publish 正常系: イベントが公開される', async () => {
    await request(app)
      .post('/events')
      .send({
        eventId: 'event-200',
        eventName: '公開テスト大会',
        startDate: '2024-07-01',
        endDate: '2024-07-02',
        raceSchedules: [
          { name: 'Day1', date: '2024-07-01' },
          { name: 'Day2', date: '2024-07-02' }
        ]
      });

    const response = await request(app).post('/events/event-200/publish');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      eventId: 'event-200',
      eventName: '公開テスト大会',
      isPublic: true
    });

    const stored = repository.events.find((event) => event.eventIdentifier === 'event-200');
    expect(stored).toBeDefined();
    expect(stored?.isPublic).toBe(true);
  });

  it('POST /events/:eventId/publish 異常系: 存在しないイベントは404を返す', async () => {
    const response = await request(app).post('/events/unknown-event/publish');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: '指定されたイベントが見つかりません。' });
  });

  it('POST /events/:eventId/publish 異常系: 既に公開済みのイベントは400を返す', async () => {
    await request(app)
      .post('/events')
      .send({
        eventId: 'event-201',
        eventName: '二重公開大会',
        startDate: '2024-07-10',
        endDate: '2024-07-11',
        raceSchedules: [
          { name: 'Day1', date: '2024-07-10' }
        ],
        publishImmediately: true
      });

    const response = await request(app).post('/events/event-201/publish');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'イベントは既に公開されています。' });
  });
});

describe('EventController (E2E) with SQLite dependencies', () => {
  it('イベントを公開すると公開イベント一覧に含まれる', async () => {
    const fixture = await createSqliteTestDataSource();
    const { dataSource, cleanup } = fixture;
    const app = createAppWithDependencies({ eventDataSource: dataSource });

    try {
      const payload = {
        eventId: 'sqlite-public-001',
        eventName: 'SQLite公開テスト大会',
        startDate: '2024-10-01',
        endDate: '2024-10-02',
        raceSchedules: [
          { name: '本戦', date: '2024-10-01' }
        ]
      } as const;

      const createResponse = await request(app).post('/events').send(payload);
      expect(createResponse.status).toBe(201);

      const publishResponse = await request(app)
        .post(`/events/${payload.eventId}/publish`)
        .send();

      expect(publishResponse.status).toBe(200);
      expect(publishResponse.body).toEqual({
        eventId: payload.eventId,
        eventName: payload.eventName,
        isPublic: true
      });

      const publicRepository = new TypeOrmPublicEventListQueryRepository(dataSource);
      const condition = PublicEventSearchCondition.create();
      const summaries = await publicRepository.findPublicSummaries(condition);

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        id: payload.eventId,
        name: payload.eventName
      });
      expect(summaries[0].startDate).toContain(payload.startDate);
      expect(summaries[0].endDate).toContain('2024-10');
    } finally {
      await cleanup();
    }
  });
});
