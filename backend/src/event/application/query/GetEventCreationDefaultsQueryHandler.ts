import EventCreationDefaultsResponseDto from './EventCreationDefaultsResponseDto';
import GetEventCreationDefaultsQuery from './GetEventCreationDefaultsQuery';

const DEFAULT_EVENT_CONFIG = Object.freeze({
  dateFormat: 'YYYY-MM-DD',
  timezone: 'UTC',
  minRaceSchedules: 1,
  maxRaceSchedules: 10,
  requireEndDateForMultipleRaces: true
} satisfies EventCreationDefaultsResponseDto);

export class GetEventCreationDefaultsQueryHandler {
  public async execute(_: GetEventCreationDefaultsQuery): Promise<EventCreationDefaultsResponseDto> {
    return { ...DEFAULT_EVENT_CONFIG };
  }
}

export default GetEventCreationDefaultsQueryHandler;
