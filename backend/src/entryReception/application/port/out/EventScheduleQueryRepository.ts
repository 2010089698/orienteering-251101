export interface RaceScheduleSummary {
  readonly id: string;
  readonly scheduledDate: Date;
}

export interface EventScheduleDetail {
  readonly id: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly raceSchedules: ReadonlyArray<RaceScheduleSummary>;
}

interface EventScheduleQueryRepository {
  findByEventId(eventId: string): Promise<EventScheduleDetail | null>;
}

export default EventScheduleQueryRepository;
