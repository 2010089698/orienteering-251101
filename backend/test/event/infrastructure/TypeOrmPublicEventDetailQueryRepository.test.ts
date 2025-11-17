import 'reflect-metadata';
import { DataSource } from 'typeorm';

import TypeOrmPublicEventDetailQueryRepository from '../../../src/event/infrastructure/repository/TypeOrmPublicEventDetailQueryRepository';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { RaceScheduleEntity } from '../../../src/event/infrastructure/repository/RaceScheduleEntity';
import EntryReceptionEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionEntity';
import EntryReceptionClassEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionClassEntity';
import { DEFAULT_ORGANIZER_ID } from '../../../src/event/application/OrganizerContext';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

describe('TypeOrmPublicEventDetailQueryRepository', () => {
  let dataSource: DataSource;
  let cleanup: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    const fixture = await createSqliteTestDataSource();
    dataSource = fixture.dataSource;
    cleanup = fixture.cleanup;
  });

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it('公開イベントの詳細を返す', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const raceRepository = dataSource.getRepository(RaceScheduleEntity);

    const event = eventRepository.create({
      id: 'PUBLIC-001',
      name: '公開大会',
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: new Date('2024-08-01T00:00:00.000Z'),
      endDate: new Date('2024-08-02T00:00:00.000Z'),
      isMultiDay: true,
      isMultiRace: true,
      isPublic: true,
    });
    await eventRepository.save(event);

    const schedules = [
      raceRepository.create({
        eventId: 'PUBLIC-001',
        name: 'Day2',
        scheduledDate: new Date('2024-08-02T00:00:00.000Z'),
      }),
      raceRepository.create({
        eventId: 'PUBLIC-001',
        name: 'Day1',
        scheduledDate: new Date('2024-08-01T00:00:00.000Z'),
      }),
    ];
    await raceRepository.save(schedules);

    const repository = new TypeOrmPublicEventDetailQueryRepository(dataSource);

    const detail = await repository.findDetailByEventId('PUBLIC-001');

    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('PUBLIC-001');
    expect(detail?.raceSchedules).toEqual([
      { name: 'Day1', scheduledDate: new Date('2024-08-01T00:00:00.000Z') },
      { name: 'Day2', scheduledDate: new Date('2024-08-02T00:00:00.000Z') },
    ]);
    expect(detail?.entryReceptionStatus).toBe('NOT_REGISTERED');
  });

  it('受付期間の状態を算出する', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const entryReceptionRepository = dataSource.getRepository(EntryReceptionEntity);
    const entryClassRepository = dataSource.getRepository(EntryReceptionClassEntity);

    const event = eventRepository.create({
      id: 'PUBLIC-002',
      name: '受付判定大会',
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: new Date('2024-09-01T00:00:00.000Z'),
      endDate: new Date('2024-09-01T12:00:00.000Z'),
      isMultiDay: false,
      isMultiRace: false,
      isPublic: true,
    });
    await eventRepository.save(event);

    const openReception = entryReceptionRepository.create({
      eventId: 'PUBLIC-002',
      raceId: 'Solo',
      receptionStart: new Date(Date.now() - 60 * 60 * 1000),
      receptionEnd: new Date(Date.now() + 60 * 60 * 1000),
    });
    openReception.entryClasses = [
      entryClassRepository.create({
        eventId: 'PUBLIC-002',
        raceId: 'Solo',
        classId: 'S-1',
        name: '一般',
      }),
    ];

    await entryReceptionRepository.save(openReception);

    const repository = new TypeOrmPublicEventDetailQueryRepository(dataSource);

    const detail = await repository.findDetailByEventId('PUBLIC-002');

    expect(detail?.entryReceptionStatus).toBe('OPEN');
  });
});
