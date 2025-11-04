import EntryReception from '../../../entryReception/domain/EntryReception';

interface EntryReceptionRepository {
  save(entryReception: EntryReception): Promise<void>;
  findByEventId(eventId: string): Promise<ReadonlyArray<EntryReception>>;
}

export default EntryReceptionRepository;
