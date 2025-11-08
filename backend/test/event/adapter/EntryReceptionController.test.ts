import 'reflect-metadata';
import { Express } from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { createAppWithDependencies } from '../../../src/app';
import { DEFAULT_ORGANIZER_ID } from '../../../src/event/application/OrganizerContext';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { RaceScheduleEntity } from '../../../src/event/infrastructure/repository/RaceScheduleEntity';
import EntryReceptionEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionEntity';
import EntryReceptionClassEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionClassEntity';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

describe('EntryReceptionController', () => {
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

  async function seedEventWithRaces(
    eventId: string,
    eventName: string,
    eventStart: Date,
    eventEnd: Date,
    races: Array<{ raceId: string; scheduledDate: Date }>
  ): Promise<void> {
    const eventRepository = dataSource.getRepository(EventEntity);
    const raceRepository = dataSource.getRepository(RaceScheduleEntity);

    const event = eventRepository.create({
      id: eventId,
      name: eventName,
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: eventStart,
      endDate: eventEnd,
      isMultiDay: true,
      isMultiRace: false,
      isPublic: false
    });
    await eventRepository.save(event);

    for (const race of races) {
      const raceEntity = raceRepository.create({
        eventId,
        name: race.raceId,
        scheduledDate: race.scheduledDate
      });
      await raceRepository.save(raceEntity);
    }
  }

  async function seedEntryReception(
    eventId: string,
    raceId: string,
    receptionStart: Date,
    receptionEnd: Date,
    entryClasses: Array<{ classId: string; name: string; capacity?: number | null }>
  ): Promise<void> {
    const entryReceptionRepository = dataSource.getRepository(EntryReceptionEntity);
    const entryClassRepository = dataSource.getRepository(EntryReceptionClassEntity);

    const entryReception = entryReceptionRepository.create({
      eventId,
      raceId,
      receptionStart,
      receptionEnd
    });
    await entryReceptionRepository.save(entryReception);

    for (const entryClass of entryClasses) {
      const classEntity = entryClassRepository.create({
        eventId,
        raceId,
        classId: entryClass.classId,
        name: entryClass.name,
        capacity: entryClass.capacity ?? null
      });
      await entryClassRepository.save(classEntity);
    }
  }

  it('GET /events/:eventId/entry-receptions/create がイベント情報と初期値を返す', async () => {
    const eventId = 'event-entry-defaults';
    const now = new Date();
    const eventStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eventEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const firstRaceDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const secondRaceDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    await seedEventWithRaces(eventId, 'エントリー受付テスト大会', eventStart, eventEnd, [
      { raceId: 'long', scheduledDate: firstRaceDate },
      { raceId: 'sprint', scheduledDate: secondRaceDate }
    ]);

    const defaultReceptionStart = new Date(now.getTime() - 60 * 60 * 1000);
    const defaultReceptionEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    await seedEntryReception(eventId, 'long', defaultReceptionStart, defaultReceptionEnd, [
      { classId: 'class-1', name: '男子エリート', capacity: 50 },
      { classId: 'class-2', name: '女子エリート' }
    ]);

    const response = await request(app).get(`/events/${eventId}/entry-receptions/create`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      eventId,
      eventName: 'エントリー受付テスト大会',
      eventEndDate: eventEnd.toISOString(),
      races: [
        {
          raceId: 'long',
          raceName: 'long',
          defaultReceptionStart: defaultReceptionStart.toISOString(),
          defaultReceptionEnd: defaultReceptionEnd.toISOString(),
          classTemplates: [
            { classId: 'class-1', name: '男子エリート', capacity: 50 },
            { classId: 'class-2', name: '女子エリート' }
          ]
        },
        {
          raceId: 'sprint',
          raceName: 'sprint',
          classTemplates: []
        }
      ]
    });
  });

  it('POST /events/:eventId/entry-receptions 成功時に受付情報を登録して返却する', async () => {
    const eventId = 'event-entry-001';
    const raceId = 'long';
    const now = new Date();
    const eventStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eventEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const raceDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    await seedEventWithRaces(eventId, 'エントリー受付テスト大会', eventStart, eventEnd, [
      { raceId, scheduledDate: raceDate }
    ]);

    const defaultsResponse = await request(app).get(
      `/events/${eventId}/entry-receptions/create`
    );

    expect(defaultsResponse.status).toBe(200);
    expect(defaultsResponse.body).toEqual({
      eventId,
      eventName: 'エントリー受付テスト大会',
      eventEndDate: eventEnd.toISOString(),
      races: [
        {
          raceId,
          raceName: raceId,
          classTemplates: []
        }
      ]
    });

    const receptionStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const receptionEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
    const payload = {
      raceId,
      receptionStart,
      receptionEnd,
      entryClasses: [
        { classId: 'class-1', name: '男子エリート', capacity: 50 },
        { classId: 'class-2', name: '女子エリート' }
      ]
    } as const;

    const response = await request(app)
      .post(`/events/${eventId}/entry-receptions`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      eventId,
      entryReceptionStatus: 'OPEN',
      raceReceptions: [
        {
          raceId,
          receptionStart,
          receptionEnd,
          entryClasses: [
            { classId: 'class-1', name: '男子エリート', capacity: 50 },
            { classId: 'class-2', name: '女子エリート' }
          ]
        }
      ]
    });

    const entryReceptionRepository = dataSource.getRepository(EntryReceptionEntity);
    const storedEntryReception = await entryReceptionRepository.findOneOrFail({
      where: { eventId, raceId },
      relations: { entryClasses: true }
    });

    expect(storedEntryReception.receptionStart.toISOString()).toBe(receptionStart);
    expect(storedEntryReception.receptionEnd.toISOString()).toBe(receptionEnd);
    expect(storedEntryReception.entryClasses).toHaveLength(2);

    const entryClassRepository = dataSource.getRepository(EntryReceptionClassEntity);
    const storedClasses = await entryClassRepository.find({ where: { eventId, raceId } });
    expect(storedClasses).toHaveLength(2);
    expect(storedClasses.map((entryClass) => entryClass.classId)).toEqual([
      'class-1',
      'class-2'
    ]);
  });

  it('POST /events/:eventId/entry-receptions バリデーションエラー時に400を返す', async () => {
    const eventId = 'event-entry-002';
    const raceId = 'middle';
    const now = new Date();
    const eventStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eventEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const raceDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    await seedEventWithRaces(eventId, 'エントリー受付テスト大会', eventStart, eventEnd, [
      { raceId, scheduledDate: raceDate }
    ]);

    const response = await request(app)
      .post(`/events/${eventId}/entry-receptions`)
      .send({
        receptionStart: '2024-04-30T09:00:00.000Z',
        receptionEnd: '2024-05-02T12:00:00.000Z',
        entryClasses: []
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('入力値が不正です。');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        'レースIDは必須です。',
        'エントリークラスを1件以上指定してください。'
      ])
    );
  });

  it('POST /events/:eventId/entry-receptions イベントが存在しない場合に404を返す', async () => {
    const response = await request(app)
      .post('/events/unknown-event/entry-receptions')
      .send({
        raceId: 'long',
        receptionStart: '2024-04-30T09:00:00.000Z',
        receptionEnd: '2024-05-02T12:00:00.000Z',
        entryClasses: [{ classId: 'class-1', name: '男子エリート', capacity: 50 }]
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: '指定されたイベントが存在しません。'
    });
  });
});
