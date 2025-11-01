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
const API_PATH_PREFIX = '/api';

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!API_BASE_URL) {
    return `${API_PATH_PREFIX}${normalizedPath}`;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');
  let payload: unknown = undefined;

  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      const details = error instanceof Error ? { cause: error } : error;
      if (!response.ok) {
        throw new EventApiError('イベントAPIの呼び出しに失敗しました。', response.status, details);
      }
      throw new EventApiError('イベントAPIのレスポンス解析に失敗しました。', response.status, details);
    }
  } else if (!response.ok) {
    try {
      const textBody = await response.text();
      payload = textBody.length > 0 ? textBody : undefined;
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    const messageFromObject =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? (payload as { message?: string }).message
        : undefined;
    const messageFromString = typeof payload === 'string' && payload.trim().length > 0 ? payload : undefined;
    const message = messageFromObject ?? messageFromString ?? 'イベントAPIの呼び出しに失敗しました。';
    throw new EventApiError(message, response.status, payload);
  }

  if (payload === undefined || payload === null) {
    throw new EventApiError('イベントAPIが空のレスポンスを返しました。', response.status);
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
