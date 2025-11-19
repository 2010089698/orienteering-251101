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
import ParticipantEntryEntity from '../../../src/participantEntry/infrastructure/repository/ParticipantEntryEntity';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

describe('StartListController', () => {
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

  async function seedEvent(
    eventId: string,
    eventName: string,
    raceId: string,
    raceDate: Date
  ): Promise<void> {
    const eventRepository = dataSource.getRepository(EventEntity);
    const raceRepository = dataSource.getRepository(RaceScheduleEntity);

    const event = eventRepository.create({
      id: eventId,
      name: eventName,
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: raceDate,
      endDate: raceDate,
      isMultiDay: false,
      isMultiRace: false,
      isPublic: false,
    });
    await eventRepository.save(event);

    const race = raceRepository.create({ eventId, name: raceId, scheduledDate: raceDate });
    await raceRepository.save(race);
  }

  async function seedEntryReception(
    eventId: string,
    raceId: string,
    receptionStart: Date,
    receptionEnd: Date,
    classes: Array<{ classId: string; name: string }>
  ): Promise<void> {
    const receptionRepository = dataSource.getRepository(EntryReceptionEntity);
    const classRepository = dataSource.getRepository(EntryReceptionClassEntity);

    const reception = receptionRepository.create({
      eventId,
      raceId,
      receptionStart,
      receptionEnd,
    });
    await receptionRepository.save(reception);

    for (const entryClass of classes) {
      const classEntity = classRepository.create({
        eventId,
        raceId,
        classId: entryClass.classId,
        name: entryClass.name,
        capacity: null,
      });
      await classRepository.save(classEntity);
    }
  }

  async function seedParticipantEntries(
    entries: Array<{
      eventId: string;
      raceId: string;
      classId: string;
      name: string;
      email: string;
      submittedAt: Date;
    }>
  ): Promise<void> {
    const participantRepository = dataSource.getRepository(ParticipantEntryEntity);
    for (const entry of entries) {
      const entity = participantRepository.create({
        eventId: entry.eventId,
        raceId: entry.raceId,
        entryClassId: entry.classId,
        participantName: entry.name,
        participantEmail: entry.email,
        submittedAt: entry.submittedAt,
      });
      await participantRepository.save(entity);
    }
  }

  it('GET /events/:eventId/start-lists/:raceId/draft スタートリストが無い場合は404を返す', async () => {
    const eventId = 'start-list-not-found';
    const raceId = 'long';
    const raceDate = new Date('2024-05-01T09:00:00Z');
    await seedEvent(eventId, 'スタートリスト未作成', raceId, raceDate);

    const response = await request(app).get(
      `/events/${eventId}/start-lists/${raceId}/draft`
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: '指定されたスタートリストが見つかりません。',
    });
  });

  it('POST /events/:eventId/start-lists/:raceId/settings 入力バリデーションエラーを返す', async () => {
    const eventId = 'start-list-invalid';
    const raceId = 'invalid';
    const raceDate = new Date('2024-05-01T09:00:00Z');
    await seedEvent(eventId, 'バリデーションテスト', raceId, raceDate);

    const response = await request(app)
      .post(`/events/${eventId}/start-lists/${raceId}/settings`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('入力値が不正です。');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        '開始日時はISO8601形式で指定してください。',
        'スタート間隔は整数で指定してください。',
        'レーン数は1以上の整数で指定してください。',
      ])
    );
  });

  it('スタートリスト作成ウィザードの各段階を通過できる', async () => {
    const eventId = 'start-list-flow';
    const raceId = 'long';
    const raceDate = new Date('2024-05-02T09:00:00Z');
    await seedEvent(eventId, 'スタートリスト作成大会', raceId, raceDate);
    await seedEntryReception(
      eventId,
      raceId,
      new Date('2024-04-01T00:00:00Z'),
      new Date('2024-04-30T00:00:00Z'),
      [
        { classId: 'class-1', name: '男子エリート' },
        { classId: 'class-2', name: '女子エリート' },
      ]
    );
    await seedParticipantEntries([
      {
        eventId,
        raceId,
        classId: 'class-1',
        name: '山田太郎',
        email: 'taro@example.com',
        submittedAt: new Date('2024-04-05T00:00:00Z'),
      },
      {
        eventId,
        raceId,
        classId: 'class-2',
        name: '佐藤花子',
        email: 'hanako@example.com',
        submittedAt: new Date('2024-04-04T00:00:00Z'),
      },
      {
        eventId,
        raceId,
        classId: 'class-1',
        name: '田中次郎',
        email: 'jiro@example.com',
        submittedAt: new Date('2024-04-06T00:00:00Z'),
      },
    ]);

    const startAt = new Date('2024-05-02T09:00:00Z');
    const startAtIso = startAt.toISOString();

    const configureResponse = await request(app)
      .post(`/events/${eventId}/start-lists/${raceId}/settings`)
      .send({
        startDateTime: startAtIso,
        intervalSeconds: 120,
        laneCount: 2,
      });

    expect(configureResponse.status).toBe(201);
    expect(configureResponse.body).toEqual({
      eventId,
      raceId,
      status: 'DRAFT',
      settings: {
        startDateTime: startAtIso,
        intervalSeconds: 120,
        laneCount: 2,
      },
      lanes: [],
      participants: [],
    });

    const assignResponse = await request(app)
      .put(`/events/${eventId}/start-lists/${raceId}/lanes`)
      .send({
        assignments: [
          { laneNumber: 1, entryClassId: 'class-1' },
          { laneNumber: 2, entryClassId: 'class-2' },
        ],
      });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body.lanes).toEqual([
      { laneNumber: 1, entryClassId: 'class-1' },
      { laneNumber: 2, entryClassId: 'class-2' },
    ]);

    const scheduleResponse = await request(app)
      .put(`/events/${eventId}/start-lists/${raceId}/participants`)
      .send({});

    expect(scheduleResponse.status).toBe(200);
    expect(scheduleResponse.body.participants).toEqual([
      {
        laneNumber: 1,
        entryClassId: 'class-1',
        participantEntryId: expect.any(String),
        participantName: '山田太郎',
        startTime: startAtIso,
        sequence: 0,
      },
      {
        laneNumber: 2,
        entryClassId: 'class-2',
        participantEntryId: expect.any(String),
        participantName: '佐藤花子',
        startTime: startAtIso,
        sequence: 1,
      },
      {
        laneNumber: 1,
        entryClassId: 'class-1',
        participantEntryId: expect.any(String),
        participantName: '田中次郎',
        startTime: new Date(startAt.getTime() + 120000).toISOString(),
        sequence: 2,
      },
    ]);

    const finalizeResponse = await request(app)
      .post(`/events/${eventId}/start-lists/${raceId}/finalize`)
      .send({});

    expect(finalizeResponse.status).toBe(200);
    expect(finalizeResponse.body.status).toBe('PUBLISHED');

    const getResponse = await request(app).get(
      `/events/${eventId}/start-lists/${raceId}/draft`
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.status).toBe('PUBLISHED');
    expect(getResponse.body.participants).toHaveLength(3);
  });
});
