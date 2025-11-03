import 'reflect-metadata';
import { Express } from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createAppWithDependencies } from '../../../src/app';
import { DEFAULT_ORGANIZER_ID } from '../../../src/event/application/OrganizerContext';
import Event from '../../../src/event/domain/Event';
import EventPeriod from '../../../src/event/domain/EventPeriod';
import RaceSchedule from '../../../src/event/domain/RaceSchedule';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { RaceScheduleEntity } from '../../../src/event/infrastructure/repository/RaceScheduleEntity';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

describe('EventController (SQLite 統合)', () => {
  let app: Express;
  let dataSource: DataSource;
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    const fixture = await createSqliteTestDataSource();
    dataSource = fixture.dataSource;
    cleanup = fixture.cleanup;
    app = createAppWithDependencies({ eventDataSource: dataSource });
  });

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it('POST /events -> GET /events/defaults を実行し、永続化されたイベントとレース日程を検証する', async () => {
    const payload = {
      eventId: 'event-sqlite-001',
      eventName: '統合テスト大会',
      startDate: '2024-09-14',
      endDate: '2024-09-16',
      raceSchedules: [
        { name: 'ロング', date: '2024-09-14' },
        { name: 'ミドル', date: '2024-09-15' },
        { name: 'スプリント', date: '2024-09-16' }
      ]
    };

    const createResponse = await request(app).post('/events').send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      eventId: payload.eventId,
      eventName: payload.eventName,
      startDate: payload.startDate,
      endDate: payload.endDate,
      isMultiDayEvent: true,
      isMultiRaceEvent: true,
      raceSchedules: payload.raceSchedules
    });

    const defaultsResponse = await request(app).get('/events/defaults');

    expect(defaultsResponse.status).toBe(200);
    expect(defaultsResponse.body).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timezone: 'UTC',
      minRaceSchedules: 1,
      maxRaceSchedules: 10,
      requireEndDateForMultipleRaces: true
    });

    const expectedEvent = Event.create({
      id: payload.eventId,
      name: payload.eventName,
      period: EventPeriod.createFromBoundaries(new Date(payload.startDate), new Date(payload.endDate)),
      raceSchedules: payload.raceSchedules.map((schedule) =>
        RaceSchedule.create(schedule.name, new Date(schedule.date))
      )
    });

    const eventRepository = dataSource.getRepository(EventEntity);
    const storedEvent = await eventRepository.findOneByOrFail({ id: payload.eventId });

    expect(storedEvent.id).toBe(expectedEvent.eventIdentifier);
    expect(storedEvent.name).toBe(expectedEvent.displayName);
    expect(storedEvent.organizerId).toBe(DEFAULT_ORGANIZER_ID);
    expect(storedEvent.startDate.toISOString()).toBe(
      expectedEvent.eventDuration.startDate.toISOString()
    );
    expect(storedEvent.endDate.toISOString()).toBe(
      expectedEvent.eventDuration.endDate.toISOString()
    );
    expect(storedEvent.isMultiDay).toBe(expectedEvent.isMultiDayEvent);
    expect(storedEvent.isMultiRace).toBe(expectedEvent.isMultiRaceEvent);

    const raceRepository = dataSource.getRepository(RaceScheduleEntity);
    const storedRaces = await raceRepository.findBy({ eventId: payload.eventId });

    expect(storedRaces).toHaveLength(expectedEvent.raceSchedules.length);

    const raceMap = new Map(storedRaces.map((race) => [race.name, race]));
    for (const expectedSchedule of expectedEvent.raceSchedules) {
      const stored = raceMap.get(expectedSchedule.name);
      expect(stored).toBeDefined();
      expect(stored?.eventId).toBe(expectedEvent.eventIdentifier);
      expect(stored?.scheduledDate.toISOString()).toBe(expectedSchedule.date.toISOString());
    }
  });

  it('GET /events データが存在する場合にイベント一覧DTOを返す', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const stored = eventRepository.create({
      id: 'event-list-001',
      name: '一覧テスト大会',
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: new Date('2024-06-01T00:00:00.000Z'),
      endDate: new Date('2024-06-02T00:00:00.000Z'),
      isMultiDay: true,
      isMultiRace: false
    });
    await eventRepository.save(stored);

    const response = await request(app)
      .get('/events')
      .query({ organizerId: DEFAULT_ORGANIZER_ID });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        eventId: 'event-list-001',
        eventName: '一覧テスト大会',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        isMultiDayEvent: true,
        isMultiRaceEvent: false
      }
    ]);
  });

  it('GET /events イベントが存在しない場合は空配列を返す', async () => {
    const response = await request(app)
      .get('/events')
      .query({ organizerId: DEFAULT_ORGANIZER_ID });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('GET /events 開催日が早い順にソートして返す', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const events = [
      eventRepository.create({
        id: 'event-list-010',
        name: '3日目大会',
        organizerId: DEFAULT_ORGANIZER_ID,
        startDate: new Date('2024-08-03T12:00:00.000Z'),
        endDate: new Date('2024-08-03T12:00:00.000Z'),
        isMultiDay: false,
        isMultiRace: false
      }),
      eventRepository.create({
        id: 'event-list-009',
        name: '1日目大会',
        organizerId: DEFAULT_ORGANIZER_ID,
        startDate: new Date('2024-08-01T12:00:00.000Z'),
        endDate: new Date('2024-08-01T12:00:00.000Z'),
        isMultiDay: false,
        isMultiRace: false
      }),
      eventRepository.create({
        id: 'event-list-011',
        name: '2日目大会',
        organizerId: DEFAULT_ORGANIZER_ID,
        startDate: new Date('2024-08-02T12:00:00.000Z'),
        endDate: new Date('2024-08-02T12:00:00.000Z'),
        isMultiDay: false,
        isMultiRace: true
      })
    ];
    await eventRepository.save(events);

    const response = await request(app)
      .get('/events')
      .query({ organizerId: DEFAULT_ORGANIZER_ID });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        eventId: 'event-list-009',
        eventName: '1日目大会',
        startDate: '2024-08-01',
        endDate: '2024-08-01',
        isMultiDayEvent: false,
        isMultiRaceEvent: false
      },
      {
        eventId: 'event-list-011',
        eventName: '2日目大会',
        startDate: '2024-08-02',
        endDate: '2024-08-02',
        isMultiDayEvent: false,
        isMultiRaceEvent: true
      },
      {
        eventId: 'event-list-010',
        eventName: '3日目大会',
        startDate: '2024-08-03',
        endDate: '2024-08-03',
        isMultiDayEvent: false,
        isMultiRaceEvent: false
      }
    ]);
  });

  it('GET /events/:eventId イベント詳細を取得する', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const raceRepository = dataSource.getRepository(RaceScheduleEntity);

    await eventRepository.save(
      eventRepository.create({
        id: 'event-detail-001',
        name: '詳細テスト大会',
        organizerId: DEFAULT_ORGANIZER_ID,
        startDate: new Date('2024-10-01T00:00:00.000Z'),
        endDate: new Date('2024-10-02T00:00:00.000Z'),
        isMultiDay: true,
        isMultiRace: true
      })
    );

    await raceRepository.save(
      raceRepository.create({
        eventId: 'event-detail-001',
        name: 'Day1',
        scheduledDate: new Date('2024-10-01T00:00:00.000Z')
      })
    );

    const response = await request(app).get('/events/event-detail-001');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      eventId: 'event-detail-001',
      eventName: '詳細テスト大会',
      startDate: '2024-10-01',
      endDate: '2024-10-02',
      isMultiDayEvent: true,
      isMultiRaceEvent: true,
      raceSchedules: [
        { name: 'Day1', date: '2024-10-01' }
      ],
      entryReceptionStatus: 'NOT_REGISTERED',
      startListStatus: 'NOT_CREATED',
      resultPublicationStatus: 'NOT_PUBLISHED'
    });
  });

  it('GET /events/:eventId 存在しないイベントの場合は404を返す', async () => {
    const response = await request(app).get('/events/unknown-event');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: '指定されたイベントが見つかりませんでした。'
    });
  });
});
