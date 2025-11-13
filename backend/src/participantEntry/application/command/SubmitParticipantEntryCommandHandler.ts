import ParticipantEntryFactory from '../../domain/ParticipantEntryFactory';
import ParticipantEntryRepository from '../port/out/ParticipantEntryRepository';
import PublicEntryReceptionQueryRepository from '../port/out/PublicEntryReceptionQueryRepository';
import SubmitParticipantEntryCommand from './SubmitParticipantEntryCommand';

class SubmitParticipantEntryCommandHandler {
  public constructor(
    private readonly participantEntryRepository: ParticipantEntryRepository,
    private readonly receptionQueryRepository: PublicEntryReceptionQueryRepository,
    private readonly participantEntryFactory: ParticipantEntryFactory
  ) {}

  public async execute(command: SubmitParticipantEntryCommand): Promise<void> {
    const reception = await this.receptionQueryRepository.findForRace(
      command.eventId,
      command.raceId
    );

    if (!reception) {
      throw new Error('指定されたレースでは参加者受付を実施していません。');
    }

    const entry = this.participantEntryFactory.createForSubmission(
      {
        eventId: command.eventId,
        raceId: command.raceId,
        entryClassId: command.entryClassId,
        applicant: {
          fullName: command.participantName,
          email: command.participantEmail
        },
        submittedAt: new Date()
      },
      reception
    );

    await this.participantEntryRepository.save(entry);
  }
}

export default SubmitParticipantEntryCommandHandler;
