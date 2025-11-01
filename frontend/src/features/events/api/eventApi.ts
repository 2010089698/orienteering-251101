import type { CreateEventRequest, RaceScheduleRequest } from '@shared/event/contracts/CreateEventContract';

export interface EventCreationDefaultsResponse {
  dateFormat: string;
  timezone: string;
  minRaceSchedules: number;
  maxRaceSchedules: number;
  requireEndDateForMultipleRaces: boolean;
}

export interface CreateEventResponseDto {
  eventId: string;
  eventName: string;
  startDate: string;
  endDate: string;
  isMultiDayEvent: boolean;
  isMultiRaceEvent: boolean;
  raceSchedules: RaceScheduleRequest[];
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

function readViteEnv(): string | undefined {
  try {
    return Function('return import.meta.env.VITE_API_BASE_URL ?? undefined;')() as string | undefined;
  } catch {
    return undefined;
  }
}

function resolveApiBaseUrl(): string {
  const fromProcess = typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : undefined;
  const fromGlobal = (globalThis as Record<string, unknown> | undefined)?.VITE_API_BASE_URL as string | undefined;
  const fromVite = readViteEnv();
  const raw = fromProcess ?? fromGlobal ?? fromVite ?? '';

  return raw.replace(/\/+$/, '');
}

const API_BASE_URL = resolveApiBaseUrl();

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

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
  const response = await fetch(buildApiUrl('/events/create/defaults'), {
    method: 'GET',
    signal
  });
  return handleResponse<EventCreationDefaultsResponse>(response);
}

export async function postCreateEvent(
  dto: CreateEventRequest,
  signal?: AbortSignal
): Promise<CreateEventResponseDto> {
  const response = await fetch(buildApiUrl('/events'), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(dto),
    signal
  });

  return handleResponse<CreateEventResponseDto>(response);
}
