import 'reflect-metadata';
import express from 'express';
import request from 'supertest';

import PublicEventController from '../../../src/event/adapter/in/web/PublicEventController';
import type ListPublicEventsQueryHandler from '../../../src/event/application/query/participant/ListPublicEventsQueryHandler';
import type GetPublicEventDetailQueryHandler from '../../../src/event/application/query/participant/GetPublicEventDetailQueryHandler';
import type GetParticipantEntryOptionsQueryHandler from '../../../src/participantEntry/application/query/GetParticipantEntryOptionsQueryHandler';
import type SubmitParticipantEntryCommandHandler from '../../../src/participantEntry/application/command/SubmitParticipantEntryCommandHandler';

describe('PublicEventController - Participant Entry endpoints (E2E)', () => {
  const listHandlerMock: Pick<ListPublicEventsQueryHandler, 'execute'> = {
    execute: jest.fn()
  };
  const detailHandlerMock: Pick<GetPublicEventDetailQueryHandler, 'execute'> = {
    execute: jest.fn()
  };
  const entryOptionsHandlerMock: Pick<GetParticipantEntryOptionsQueryHandler, 'execute'> = {
    execute: jest.fn()
  };
  const submitEntryHandlerMock: Pick<SubmitParticipantEntryCommandHandler, 'execute'> = {
    execute: jest.fn()
  };

  const controller = new PublicEventController(
    listHandlerMock as unknown as ListPublicEventsQueryHandler,
    detailHandlerMock as unknown as GetPublicEventDetailQueryHandler,
    entryOptionsHandlerMock as unknown as GetParticipantEntryOptionsQueryHandler,
    submitEntryHandlerMock as unknown as SubmitParticipantEntryCommandHandler
  );

  const app = express();
  app.use(express.json());
  app.use(controller.router);

  beforeEach(() => {
    (submitEntryHandlerMock.execute as jest.Mock).mockReset();
  });

  it('受付期間外エラーを400で返却する', async () => {
    (submitEntryHandlerMock.execute as jest.Mock).mockRejectedValue(
      new Error('受付期間外の申込はできません。')
    );

    const response = await request(app)
      .post('/public/events/event-1/entries')
      .send({
        eventId: 'event-1',
        raceId: 'race-1',
        classId: 'class-1',
        participant: {
          name: '参加者 太郎',
          email: 'taro@example.com'
        }
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: '受付期間外の申込はできません。' });
    expect(submitEntryHandlerMock.execute).toHaveBeenCalled();
  });

  it('受付対象外クラスエラーを400で返却する', async () => {
    (submitEntryHandlerMock.execute as jest.Mock).mockRejectedValue(
      new Error('指定されたエントリークラスは受付対象外です。')
    );

    const response = await request(app)
      .post('/public/events/event-1/entries')
      .send({
        eventId: 'event-1',
        raceId: 'race-1',
        classId: 'class-99',
        participant: {
          name: '参加者 太郎',
          email: 'taro@example.com'
        }
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: '指定されたエントリークラスは受付対象外です。'
    });
    expect(submitEntryHandlerMock.execute).toHaveBeenCalled();
  });
});
