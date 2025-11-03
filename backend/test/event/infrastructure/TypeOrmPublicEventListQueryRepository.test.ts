import { DataSource } from 'typeorm';

import PublicEventSearchCondition from '../../../src/event/application/query/participant/PublicEventSearchCondition';
import TypeOrmPublicEventListQueryRepository from '../../../src/event/infrastructure/repository/TypeOrmPublicEventListQueryRepository';
import { EventEntity } from '../../../src/event/infrastructure/repository/EventEntity';
import { createSqliteTestDataSource } from '../../support/createSqliteTestDataSource';

function createEventEntity(params: {
  id: string;
  name: string;
  start: string;
  end: string;
  isPublic?: boolean;
}): EventEntity {
  const entity = new EventEntity();
  entity.id = params.id;
  entity.name = params.name;
  entity.organizerId = 'organizer';
  entity.startDate = new Date(params.start);
  entity.endDate = new Date(params.end);
  entity.isMultiDay = params.start !== params.end;
  entity.isMultiRace = false;
  entity.isPublic = params.isPublic ?? true;
  return entity;
}

describe('TypeOrmPublicEventListQueryRepository', () => {
  let dataSource: DataSource;
  let repository: TypeOrmPublicEventListQueryRepository;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const fixture = await createSqliteTestDataSource();
    dataSource = fixture.dataSource;
    repository = new TypeOrmPublicEventListQueryRepository(dataSource);
    cleanup = fixture.cleanup;
  });

  beforeEach(async () => {
    await dataSource.getRepository(EventEntity).clear();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('公開フラグが立っているイベントのみを返す', async () => {
    const ormRepository = dataSource.getRepository(EventEntity);
    await ormRepository.save([
      createEventEntity({
        id: 'public-1',
        name: '公開イベント1',
        start: '2024-06-01T09:00:00.000Z',
        end: '2024-06-01T12:00:00.000Z',
        isPublic: true
      }),
      createEventEntity({
        id: 'private-1',
        name: '非公開イベント',
        start: '2024-06-05T09:00:00.000Z',
        end: '2024-06-05T12:00:00.000Z',
        isPublic: false
      })
    ]);

    const summaries = await repository.findPublicSummaries(PublicEventSearchCondition.create());

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: 'public-1',
      name: '公開イベント1'
    });
  });

  it('開始日の範囲でフィルタできる', async () => {
    const ormRepository = dataSource.getRepository(EventEntity);
    await ormRepository.save([
      createEventEntity({
        id: 'range-early',
        name: '早期イベント',
        start: '2024-05-01T00:00:00.000Z',
        end: '2024-05-01T06:00:00.000Z'
      }),
      createEventEntity({
        id: 'range-middle',
        name: '中間イベント',
        start: '2024-05-10T00:00:00.000Z',
        end: '2024-05-10T06:00:00.000Z'
      }),
      createEventEntity({
        id: 'range-late',
        name: '遅延イベント',
        start: '2024-05-20T00:00:00.000Z',
        end: '2024-05-20T06:00:00.000Z'
      })
    ]);

    const condition = PublicEventSearchCondition.create({
      startDateFrom: new Date('2024-05-05T00:00:00.000Z'),
      startDateTo: new Date('2024-05-15T23:59:59.000Z')
    });

    const summaries = await repository.findPublicSummaries(condition);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ id: 'range-middle' });
  });

  it('開催状況でフィルタできる', async () => {
    const referenceDate = new Date('2024-06-10T09:00:00.000Z');
    const ormRepository = dataSource.getRepository(EventEntity);
    await ormRepository.save([
      createEventEntity({
        id: 'upcoming',
        name: 'これからのイベント',
        start: '2024-06-15T00:00:00.000Z',
        end: '2024-06-15T06:00:00.000Z'
      }),
      createEventEntity({
        id: 'ongoing',
        name: '開催中のイベント',
        start: '2024-06-09T00:00:00.000Z',
        end: '2024-06-10T12:00:00.000Z'
      }),
      createEventEntity({
        id: 'past',
        name: '終了したイベント',
        start: '2024-06-05T00:00:00.000Z',
        end: '2024-06-05T06:00:00.000Z'
      })
    ]);

    const summaries = await repository.findPublicSummaries(
      PublicEventSearchCondition.create({
        statuses: ['ongoing'],
        referenceDate
      })
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ id: 'ongoing' });

    const upcoming = await repository.findPublicSummaries(
      PublicEventSearchCondition.create({
        statuses: ['upcoming'],
        referenceDate
      })
    );

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]).toMatchObject({ id: 'upcoming' });

    const past = await repository.findPublicSummaries(
      PublicEventSearchCondition.create({
        statuses: ['past'],
        referenceDate
      })
    );

    expect(past).toHaveLength(1);
    expect(past[0]).toMatchObject({ id: 'past' });
  });
});
