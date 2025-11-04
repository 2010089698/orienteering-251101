import 'reflect-metadata';

import { DataSource } from 'typeorm';

import TypeOrmEntryReceptionRepository from '../../../src/entryReception/infrastructure/repository/TypeOrmEntryReceptionRepository';
import EntryClass from '../../../src/entryReception/domain/EntryClass';
import EntryReception from '../../../src/entryReception/domain/EntryReception';
import ReceptionWindow from '../../../src/entryReception/domain/ReceptionWindow';
import EventPeriod from '../../../src/event/domain/EventPeriod';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { DEFAULT_ORGANIZER_ID } from '../../../src/event/application/OrganizerContext';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

describe('TypeOrmEntryReceptionRepository', () => {
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

  async function seedEvent(eventId: string, start: Date, end: Date): Promise<void> {
    const eventRepository = dataSource.getRepository(EventEntity);
    const event = eventRepository.create({
      id: eventId,
      name: 'テストイベント',
      organizerId: DEFAULT_ORGANIZER_ID,
      startDate: start,
      endDate: end,
      isMultiDay: true,
      isMultiRace: true,
    });
    await eventRepository.save(event);
  }

  function createEntryReception(
    eventId: string,
    raceId: string,
    receptionStart: Date,
    receptionEnd: Date
  ): EntryReception {
    const receptionWindow = ReceptionWindow.create(receptionStart, receptionEnd);
    const eventPeriod = EventPeriod.createFromBoundaries(receptionStart, receptionEnd);
    const classes = [
      EntryClass.create({ id: 'class-1', name: '男子', capacity: 100 }),
      EntryClass.create({ id: 'class-2', name: '女子', capacity: 80 }),
    ];

    return EntryReception.register(
      {
        eventId,
        raceId,
        receptionWindow,
        entryClasses: classes,
      },
      eventPeriod
    );
  }

  it('エントリー受付を保存および取得できる', async () => {
    await seedEvent(
      'EVT-ENTRY',
      new Date('2024-05-01T00:00:00.000Z'),
      new Date('2024-05-10T00:00:00.000Z')
    );
    const repository = new TypeOrmEntryReceptionRepository(dataSource);
    const entryReception = createEntryReception(
      'EVT-ENTRY',
      'Race-1',
      new Date('2024-05-02T00:00:00.000Z'),
      new Date('2024-05-05T00:00:00.000Z')
    );

    await repository.save(entryReception);

    const stored = await repository.findByEventId('EVT-ENTRY');

    expect(stored).toHaveLength(1);
    expect(stored[0].targetRaceId).toBe('Race-1');
    expect(stored[0].entryClasses).toHaveLength(2);
    expect(stored[0].entryClasses[0].identifier).toBe('class-1');
  });

  it('同一レースの受付を上書き保存する', async () => {
    await seedEvent(
      'EVT-OVERWRITE',
      new Date('2024-06-01T00:00:00.000Z'),
      new Date('2024-06-10T00:00:00.000Z')
    );
    const repository = new TypeOrmEntryReceptionRepository(dataSource);

    const first = createEntryReception(
      'EVT-OVERWRITE',
      'Race-1',
      new Date('2024-06-02T00:00:00.000Z'),
      new Date('2024-06-04T00:00:00.000Z')
    );
    await repository.save(first);

    const secondWindow = ReceptionWindow.create(
      new Date('2024-06-03T00:00:00.000Z'),
      new Date('2024-06-05T00:00:00.000Z')
    );
    const eventPeriod = EventPeriod.createFromBoundaries(
      new Date('2024-06-01T00:00:00.000Z'),
      new Date('2024-06-10T00:00:00.000Z')
    );
    const updated = EntryReception.register(
      {
        eventId: 'EVT-OVERWRITE',
        raceId: 'Race-1',
        receptionWindow: secondWindow,
        entryClasses: [
          EntryClass.create({ id: 'class-3', name: 'ジュニア', capacity: 60 }),
        ],
      },
      eventPeriod
    );

    await repository.save(updated);

    const stored = await repository.findByEventId('EVT-OVERWRITE');

    expect(stored).toHaveLength(1);
    expect(stored[0].receptionWindow.opensAt.toISOString()).toBe(
      new Date('2024-06-03T00:00:00.000Z').toISOString()
    );
    expect(stored[0].entryClasses).toHaveLength(1);
    expect(stored[0].entryClasses[0].identifier).toBe('class-3');
  });
});
