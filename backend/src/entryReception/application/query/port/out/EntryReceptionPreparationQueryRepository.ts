import EntryReceptionPreparationResponseDto from '../../EntryReceptionPreparationResponseDto';

interface EntryReceptionPreparationQueryRepository {
  findByEventId(
    eventId: string
  ): Promise<EntryReceptionPreparationResponseDto | null>;
}

export default EntryReceptionPreparationQueryRepository;
