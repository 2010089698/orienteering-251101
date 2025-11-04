export interface EntryReceptionClassDto {
  readonly classId: string;
  readonly name: string;
  readonly capacity?: number;
}

export interface RaceEntryReceptionDto {
  readonly raceId: string;
  readonly receptionStart: Date;
  readonly receptionEnd: Date;
  readonly entryClasses: ReadonlyArray<EntryReceptionClassDto>;
}

interface EntryReceptionPreparationResponseDto {
  readonly eventId: string;
  readonly raceReceptions: ReadonlyArray<RaceEntryReceptionDto>;
}

export default EntryReceptionPreparationResponseDto;
