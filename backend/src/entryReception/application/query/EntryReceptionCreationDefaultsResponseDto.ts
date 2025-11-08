export interface EntryReceptionClassTemplateDto {
  readonly classId: string;
  readonly name: string;
  readonly capacity?: number;
}

export interface EntryReceptionRaceDefaultsDto {
  readonly raceId: string;
  readonly raceName: string;
  readonly defaultReceptionStart?: Date;
  readonly defaultReceptionEnd?: Date;
  readonly classTemplates: ReadonlyArray<EntryReceptionClassTemplateDto>;
}

interface EntryReceptionCreationDefaultsResponseDto {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventEndDate: Date;
  readonly races: ReadonlyArray<EntryReceptionRaceDefaultsDto>;
}

export default EntryReceptionCreationDefaultsResponseDto;
