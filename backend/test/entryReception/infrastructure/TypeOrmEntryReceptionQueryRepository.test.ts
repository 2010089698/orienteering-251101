import 'reflect-metadata';

import { DataSource } from 'typeorm';

import TypeOrmEntryReceptionQueryRepository from '../../../src/entryReception/infrastructure/repository/TypeOrmEntryReceptionQueryRepository';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { DEFAULT_ORGANIZER_ID } from '../../../src/event/application/OrganizerContext';
import EntryReceptionEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionEntity';
import EntryReceptionClassEntity from '../../../src/entryReception/infrastructure/repository/EntryReceptionClassEntity';

describe('TypeOrmEntryReceptionQueryRepository', () => {
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

  async function seedEvent(eventId: string): Promise<void> {
    const repository = dataSource.getRepository(EventEntity);
    await repository.save(
      repository.create({
        id: eventId,
        name: '大会',
        organizerId: DEFAULT_ORGANIZER_ID,
        startDate: new Date('2024-05-01T00:00:00.000Z'),
        endDate: new Date('2024-05-10T00:00:00.000Z'),
        isMultiDay: true,
        isMultiRace: true,
      })
    );
  }

  it('イベントが存在しない場合は null を返す', async () => {
    const repository = new TypeOrmEntryReceptionQueryRepository(dataSource);

    const result = await repository.findByEventId('missing');

    expect(result).toBeNull();
  });

  it('エントリー受付が存在しない場合でも空の結果を返す', async () => {
    await seedEvent('EVT-EMPTY');
    const repository = new TypeOrmEntryReceptionQueryRepository(dataSource);

    const result = await repository.findByEventId('EVT-EMPTY');

    expect(result).not.toBeNull();
    expect(result?.eventId).toBe('EVT-EMPTY');
    expect(result?.raceReceptions).toHaveLength(0);
  });

  it('エントリー受付情報を取得する', async () => {
    await seedEvent('EVT-QUERY');
    const entryReceptionRepository = dataSource.getRepository(EntryReceptionEntity);
    const entryClassRepository = dataSource.getRepository(EntryReceptionClassEntity);

    const reception = entryReceptionRepository.create({
      eventId: 'EVT-QUERY',
      raceId: 'Race-1',
      receptionStart: new Date('2024-05-02T00:00:00.000Z'),
      receptionEnd: new Date('2024-05-05T00:00:00.000Z'),
    });
    reception.entryClasses = [
      entryClassRepository.create({
        eventId: 'EVT-QUERY',
        raceId: 'Race-1',
        classId: 'class-1',
        name: '男子',
        capacity: 100,
      }),
      entryClassRepository.create({
        eventId: 'EVT-QUERY',
        raceId: 'Race-1',
        classId: 'class-2',
        name: '女子',
        capacity: 80,
      }),
    ];

    await entryReceptionRepository.save(reception);

    const repository = new TypeOrmEntryReceptionQueryRepository(dataSource);

    const result = await repository.findByEventId('EVT-QUERY');

    expect(result?.raceReceptions).toHaveLength(1);
    expect(result?.raceReceptions[0].raceId).toBe('Race-1');
    expect(result?.raceReceptions[0].entryClasses).toHaveLength(2);
  });
});
