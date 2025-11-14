import SubmitParticipantEntryCommand from '../../../src/participantEntry/application/command/SubmitParticipantEntryCommand';
import SubmitParticipantEntryCommandHandler from '../../../src/participantEntry/application/command/SubmitParticipantEntryCommandHandler';
import type ParticipantEntryRepository from '../../../src/participantEntry/application/port/out/ParticipantEntryRepository';
import type PublicEntryReceptionQueryRepository from '../../../src/participantEntry/application/port/out/PublicEntryReceptionQueryRepository';
import ParticipantEntryFactory from '../../../src/participantEntry/domain/ParticipantEntryFactory';
import ParticipantEntryAcceptanceService from '../../../src/participantEntry/domain/service/ParticipantEntryAcceptanceService';

describe('SubmitParticipantEntryCommandHandler', () => {
  const participantEntryRepositoryMock: jest.Mocked<ParticipantEntryRepository> = {
    save: jest.fn()
  };
  const receptionQueryRepositoryMock: jest.Mocked<PublicEntryReceptionQueryRepository> = {
    findForRace: jest.fn()
  };
  const acceptanceService = new ParticipantEntryAcceptanceService();
  const factory = new ParticipantEntryFactory(acceptanceService);
  const handler = new SubmitParticipantEntryCommandHandler(
    participantEntryRepositoryMock,
    receptionQueryRepositoryMock,
    factory
  );

  const receptionSummary = {
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
  } as const;

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('受付情報が存在する場合にエントリーを保存する', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-02T12:00:00.000Z'));
    receptionQueryRepositoryMock.findForRace.mockResolvedValue(receptionSummary);
    participantEntryRepositoryMock.save.mockResolvedValue(undefined);

    const command = new SubmitParticipantEntryCommand(
      'event-1',
      'race-1',
      'class-2',
      '参加者 太郎',
      'taro@example.com'
    );

    await handler.execute(command);

    expect(participantEntryRepositoryMock.save).toHaveBeenCalledTimes(1);
    const [savedEntry] = participantEntryRepositoryMock.save.mock.calls[0];
    expect(savedEntry.eventId).toBe('event-1');
    expect(savedEntry.raceId).toBe('race-1');
    expect(savedEntry.entryClassId).toBe('class-2');
    expect(savedEntry.applicant.fullName).toBe('参加者 太郎');
    expect(savedEntry.applicant.email).toBe('taro@example.com');
    expect(savedEntry.submittedAt.toISOString()).toBe('2024-05-02T12:00:00.000Z');
  });

  it('受付情報が取得できない場合はエラーになる', async () => {
    receptionQueryRepositoryMock.findForRace.mockResolvedValue(null);

    const command = new SubmitParticipantEntryCommand(
      'event-1',
      'race-1',
      'class-1',
      '参加者 太郎',
      'taro@example.com'
    );

    await expect(handler.execute(command)).rejects.toThrow(
      '指定されたレースでは参加者受付を実施していません。'
    );
    expect(participantEntryRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('受付期間外の場合はエラーになり保存されない', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-04-30T12:00:00.000Z'));
    receptionQueryRepositoryMock.findForRace.mockResolvedValue(receptionSummary);

    const command = new SubmitParticipantEntryCommand(
      'event-1',
      'race-1',
      'class-1',
      '参加者 太郎',
      'taro@example.com'
    );

    await expect(handler.execute(command)).rejects.toThrow('受付期間外の申込はできません。');
    expect(participantEntryRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('受付対象外のクラスを指定した場合はエラーになる', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-02T12:00:00.000Z'));
    receptionQueryRepositoryMock.findForRace.mockResolvedValue(receptionSummary);

    const command = new SubmitParticipantEntryCommand(
      'event-1',
      'race-1',
      'class-999',
      '参加者 太郎',
      'taro@example.com'
    );

    await expect(handler.execute(command)).rejects.toThrow(
      '指定されたエントリークラスは受付対象外です。'
    );
    expect(participantEntryRepositoryMock.save).not.toHaveBeenCalled();
  });
});
