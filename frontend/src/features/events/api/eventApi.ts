export interface EventCreationDefaultsResponse {
  dateFormat: string;
  timezone: string;
  minRaceSchedules: number;
  maxRaceSchedules: number;
  requireEndDateForMultipleRaces: boolean;
}

export interface RaceScheduleRequestDto {
  name: string;
  date: string;
}

export interface CreateEventRequestDto {
  eventId: string;
  eventName: string;
  startDate: string;
  endDate?: string;
  raceSchedules: RaceScheduleRequestDto[];
}

export interface CreateEventResponseDto {
  eventId: string;
  eventName: string;
  startDate: string;
  endDate: string;
  isMultiDayEvent: boolean;
  isMultiRaceEvent: boolean;
  raceSchedules: RaceScheduleRequestDto[];
}

export class EventApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'EventApiError';
  }
}

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

const EVENTS_API_BASE_PATH = '/api/events';

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('Content-Type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = (payload as { message?: string } | undefined)?.message ?? 'イベントAPIの呼び出しに失敗しました。';
    throw new EventApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function fetchEventCreationDefaults(signal?: AbortSignal): Promise<EventCreationDefaultsResponse> {
  const response = await fetch(`${EVENTS_API_BASE_PATH}/create/defaults`, {
    method: 'GET',
    signal
  });
  return handleResponse<EventCreationDefaultsResponse>(response);
}

export async function postCreateEvent(
  dto: CreateEventRequestDto,
  signal?: AbortSignal
): Promise<CreateEventResponseDto> {
  const response = await fetch(EVENTS_API_BASE_PATH, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(dto),
    signal
  });

  return handleResponse<CreateEventResponseDto>(response);
}
