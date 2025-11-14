import GetParticipantEntryOptionsQuery from '../../../src/participantEntry/application/query/GetParticipantEntryOptionsQuery';
import GetParticipantEntryOptionsQueryHandler from '../../../src/participantEntry/application/query/GetParticipantEntryOptionsQueryHandler';
import type PublicEntryReceptionQueryRepository from '../../../src/participantEntry/application/port/out/PublicEntryReceptionQueryRepository';

describe('GetParticipantEntryOptionsQueryHandler', () => {
  const repositoryMock: jest.Mocked<PublicEntryReceptionQueryRepository> = {
    findForRace: jest.fn()
  };
  const handler = new GetParticipantEntryOptionsQueryHandler(repositoryMock);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('レース受付情報を取得できた場合にDTOを返す', async () => {
    repositoryMock.findForRace.mockResolvedValue({
      eventId: 'event-1',
      raceId: 'race-1',
      receptionWindow: {
        opensAt: new Date('2024-05-01T00:00:00.000Z'),
        closesAt: new Date('2024-05-10T23:59:59.000Z')
      },
      entryClasses: [
        { id: 'class-1', name: 'クラス1' },
        { id: 'class-2', name: 'クラス2' }
      ]
    });

    const query = new GetParticipantEntryOptionsQuery('event-1', 'race-1');
    const response = await handler.execute(query);

    expect(response).toEqual({
      eventId: 'event-1',
      raceId: 'race-1',
      receptionWindow: {
        opensAt: new Date('2024-05-01T00:00:00.000Z'),
        closesAt: new Date('2024-05-10T23:59:59.000Z')
      },
      entryClasses: [
        { id: 'class-1', name: 'クラス1' },
        { id: 'class-2', name: 'クラス2' }
      ]
    });
    expect(repositoryMock.findForRace).toHaveBeenCalledWith('event-1', 'race-1');
  });

  it('受付情報が存在しない場合はエラーを送出する', async () => {
    repositoryMock.findForRace.mockResolvedValue(null);

    const query = new GetParticipantEntryOptionsQuery('event-1', 'race-1');

    await expect(handler.execute(query)).rejects.toThrow(
      '指定されたレースの受付情報が見つかりません。'
    );
  });
});
