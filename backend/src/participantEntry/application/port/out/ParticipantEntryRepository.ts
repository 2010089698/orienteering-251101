import ParticipantEntry from '../../../domain/ParticipantEntry';

interface ParticipantEntryRepository {
  save(entry: ParticipantEntry): Promise<void>;
}

export default ParticipantEntryRepository;
