import EntryReceptionSummary from '../../../domain/service/EntryReceptionSummary';

interface PublicEntryReceptionQueryRepository {
  findForRace(
    eventId: string,
    raceId: string
  ): Promise<EntryReceptionSummary | null>;
}

export default PublicEntryReceptionQueryRepository;
