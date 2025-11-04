import 'reflect-metadata';
import { DataSource } from 'typeorm';

import TypeOrmEventDetailQueryRepository from '../../../src/event/infrastructure/repository/TypeOrmEventDetailQueryRepository';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { RaceScheduleEntity } from '../../../src/event/infrastructure/repository/RaceScheduleEntity';
import EntryReceptionEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionEntity';
import EntryReceptionClassEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionClassEntity';
import { DEFAULT_ORGANIZER_ID } from '../../../src/event/application/OrganizerContext';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

describe('TypeOrmEventDetailQueryRepository', () => {
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

  it('イベントとレース日程を取得し読み取りモデルを返す', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const raceRepository = dataSource.getRepository(RaceScheduleEntity);

    const event = eventRepository.create({
      id: 'EVT-001',
      name: '春の大会',
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: new Date('2024-04-01T00:00:00.000Z'),
      endDate: new Date('2024-04-02T00:00:00.000Z'),
      isMultiDay: true,
      isMultiRace: true
    });
    await eventRepository.save(event);

    const schedules = [
      raceRepository.create({
        eventId: 'EVT-001',
        name: 'Day2',
        scheduledDate: new Date('2024-04-02T00:00:00.000Z')
      }),
      raceRepository.create({
        eventId: 'EVT-001',
        name: 'Day1',
        scheduledDate: new Date('2024-04-01T00:00:00.000Z')
      })
    ];
    await raceRepository.save(schedules);

    const repository = new TypeOrmEventDetailQueryRepository(dataSource);

    const detail = await repository.findDetailByEventId('EVT-001');

    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('EVT-001');
    expect(detail?.name).toBe('春の大会');
    expect(detail?.raceSchedules).toEqual([
      { name: 'Day1', scheduledDate: new Date('2024-04-01T00:00:00.000Z') },
      { name: 'Day2', scheduledDate: new Date('2024-04-02T00:00:00.000Z') }
    ]);
    expect(detail?.entryReceptionStatus).toBe('NOT_REGISTERED');
    expect(detail?.startListStatus).toBe('NOT_CREATED');
    expect(detail?.resultPublicationStatus).toBe('NOT_PUBLISHED');
  });

  it('イベントが存在しない場合は null を返す', async () => {
    const repository = new TypeOrmEventDetailQueryRepository(dataSource);

    const detail = await repository.findDetailByEventId('missing');

    expect(detail).toBeNull();
  });

  it('エントリー受付が存在する場合に状態を判定する', async () => {
    const eventRepository = dataSource.getRepository(EventEntity);
    const raceRepository = dataSource.getRepository(RaceScheduleEntity);
    const entryReceptionRepository = dataSource.getRepository(EntryReceptionEntity);
    const entryClassRepository = dataSource.getRepository(EntryReceptionClassEntity);

    const event = eventRepository.create({
      id: 'EVT-002',
      name: '夏の大会',
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: new Date('2024-07-01T00:00:00.000Z'),
      endDate: new Date('2024-07-02T00:00:00.000Z'),
      isMultiDay: false,
      isMultiRace: true,
    });
    await eventRepository.save(event);

    await raceRepository.save([
      raceRepository.create({
        eventId: 'EVT-002',
        name: 'Sprint',
        scheduledDate: new Date('2024-07-01T00:00:00.000Z'),
      }),
      raceRepository.create({
        eventId: 'EVT-002',
        name: 'Middle',
        scheduledDate: new Date('2024-07-02T00:00:00.000Z'),
      }),
    ]);

    const openReception = entryReceptionRepository.create({
      eventId: 'EVT-002',
      raceId: 'Sprint',
      receptionStart: new Date(Date.now() - 60 * 60 * 1000),
      receptionEnd: new Date(Date.now() + 60 * 60 * 1000),
    });
    openReception.entryClasses = [
      entryClassRepository.create({
        eventId: 'EVT-002',
        raceId: 'Sprint',
        classId: 'S-1',
        name: '男子スプリント',
        capacity: 80,
      }),
    ];

    const closedReception = entryReceptionRepository.create({
      eventId: 'EVT-002',
      raceId: 'Middle',
      receptionStart: new Date('2024-06-01T00:00:00.000Z'),
      receptionEnd: new Date('2024-06-10T00:00:00.000Z'),
    });
    closedReception.entryClasses = [
      entryClassRepository.create({
        eventId: 'EVT-002',
        raceId: 'Middle',
        classId: 'M-1',
        name: '男子ミドル',
        capacity: 120,
      }),
    ];

    await entryReceptionRepository.save([openReception, closedReception]);

    const repository = new TypeOrmEventDetailQueryRepository(dataSource);

    const detail = await repository.findDetailByEventId('EVT-002');

    expect(detail?.entryReceptionStatus).toBe('OPEN');
  });
});
