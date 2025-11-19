import StartListDraft from '../../../domain/StartListDraft';

interface StartListRepository {
  save(draft: StartListDraft): Promise<void>;
  findByEventAndRace(eventId: string, raceId: string): Promise<StartListDraft | null>;
}

export default StartListRepository;
