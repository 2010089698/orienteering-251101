export interface EntryClassSummaryDto {
  readonly classId: string;
  readonly name: string;
}

interface EntryReceptionForStartListQuery {
  findEntryClasses(eventId: string, raceId: string): Promise<ReadonlyArray<EntryClassSummaryDto>>;
}

export type { EntryReceptionForStartListQuery };
export default EntryReceptionForStartListQuery;
