import ParticipantEntryOptionsResponseDto from './ParticipantEntryOptionsResponseDto';
import GetParticipantEntryOptionsQuery from './GetParticipantEntryOptionsQuery';
import PublicEntryReceptionQueryRepository from '../port/out/PublicEntryReceptionQueryRepository';

class GetParticipantEntryOptionsQueryHandler {
  public constructor(
    private readonly receptionQueryRepository: PublicEntryReceptionQueryRepository
  ) {}

  public async execute(
    query: GetParticipantEntryOptionsQuery
  ): Promise<ParticipantEntryOptionsResponseDto> {
    const reception = await this.receptionQueryRepository.findForRace(
      query.eventId,
      query.raceId
    );

    if (!reception) {
      throw new Error('指定されたレースの受付情報が見つかりません。');
    }

    return {
      eventId: reception.eventId,
      raceId: reception.raceId,
      receptionWindow: {
        opensAt: new Date(reception.receptionWindow.opensAt.getTime()),
        closesAt: new Date(reception.receptionWindow.closesAt.getTime())
      },
      entryClasses: reception.entryClasses.map((entryClass) => ({
        id: entryClass.id,
        name: entryClass.name
      }))
    };
  }
}

export default GetParticipantEntryOptionsQueryHandler;
