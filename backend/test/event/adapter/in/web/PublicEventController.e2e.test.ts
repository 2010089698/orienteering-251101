import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import PublicEventController from '../../../../../src/event/adapter/in/web/PublicEventController';
import type ListPublicEventsQueryHandler from '../../../../../src/event/application/query/participant/ListPublicEventsQueryHandler';
import GetPublicEventDetailQuery from '../../../../../src/event/application/query/participant/GetPublicEventDetailQuery';
import type GetPublicEventDetailQueryHandler from '../../../../../src/event/application/query/participant/GetPublicEventDetailQueryHandler';

function createApp(
  listHandler: Pick<ListPublicEventsQueryHandler, 'execute'>,
  detailHandler: Pick<GetPublicEventDetailQueryHandler, 'execute'>
) {
  const app = express();
  const controller = new PublicEventController(
    listHandler as ListPublicEventsQueryHandler,
    detailHandler as GetPublicEventDetailQueryHandler
  );
  app.use(express.json());
  app.use(controller.router);
  return app;
}

describe('PublicEventController (詳細取得)', () => {
  const listHandler: Pick<ListPublicEventsQueryHandler, 'execute'> = {
    execute: jest.fn()
  };
  const detailHandler: Pick<GetPublicEventDetailQueryHandler, 'execute'> = {
    execute: jest.fn()
  };

  const app = createApp(listHandler, detailHandler);

  beforeEach(() => {
    (listHandler.execute as jest.Mock).mockReset();
    (detailHandler.execute as jest.Mock).mockReset();
  });

  it('GET /public/events/:eventId 正常系: 公開イベント詳細を返す', async () => {
    (detailHandler.execute as jest.Mock).mockResolvedValue({
      eventId: 'event-1',
      eventName: '公開イベント',
      startDate: '2024-06-01T00:00:00.000Z',
      endDate: '2024-06-02T00:00:00.000Z',
      isMultiDayEvent: true,
      isMultiRaceEvent: false,
      raceSchedules: [
        { name: 'Day1', date: '2024-06-01T00:00:00.000Z' },
        { name: 'Day2', date: '2024-06-02T00:00:00.000Z' }
      ],
      entryReceptionStatus: 'OPEN',
      startListStatus: 'PUBLISHED',
      resultPublicationStatus: 'PUBLISHED'
    });

    const response = await request(app).get('/public/events/event-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      eventId: 'event-1',
      eventName: '公開イベント',
      startDate: '2024-06-01',
      endDate: '2024-06-02',
      isMultiDayEvent: true,
      isMultiRaceEvent: false,
      raceSchedules: [
        { name: 'Day1', date: '2024-06-01' },
        { name: 'Day2', date: '2024-06-02' }
      ],
      entryReceptionStatus: 'OPEN',
      startListStatus: 'PUBLISHED',
      resultPublicationStatus: 'PUBLISHED'
    });
    expect(detailHandler.execute).toHaveBeenCalledWith(
      GetPublicEventDetailQuery.forEvent('event-1')
    );
  });

  it('GET /public/events/:eventId 異常系: 存在しないイベントは404を返す', async () => {
    (detailHandler.execute as jest.Mock).mockRejectedValue(
      new Error('指定されたイベントが見つかりませんでした。')
    );

    const response = await request(app).get('/public/events/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: '指定されたイベントが見つかりませんでした。'
    });
  });

  it('GET /public/events/:eventId 異常系: パラメータが不正な場合は400を返す', async () => {
    const response = await request(app).get('/public/events/%20');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'イベントIDを指定してください。'
    });
    expect(detailHandler.execute).not.toHaveBeenCalled();
  });
});
