import type { CreateEventRequest, RaceScheduleRequest } from '@shared/event/contracts/CreateEventContract';
import {
  eventSummaryListResponseSchema,
  type EventSummaryListResponse
} from '@shared/event/contracts/EventSummaryContract';
import {
  organizerEventDetailResponseSchema,
  type OrganizerEventDetailResponse
} from '@shared/event/contracts/OrganizerEventDetailContract';
import {
  publicEventDetailResponseSchema,
  type PublicEventDetailResponse
} from '@shared/event/contracts/PublicEventDetailContract';
import {
  entryReceptionCreationDefaultsResponseSchema,
  type EntryReceptionCreationDefaultsResponse as EntryReceptionCreationDefaultsContractResponse,
  type EntryReceptionRaceDefaults as EntryReceptionRaceDefaultsContract,
  type EntryReceptionClassTemplate as EntryReceptionClassTemplateContract
} from '@shared/event/contracts/EntryReceptionCreationDefaultsContract';
import {
  entryReceptionPreparationResponseSchema,
  type EntryReceptionPreparationResponse as EntryReceptionPreparationContractResponse,
  type RegisterEntryReceptionRequest
} from '@shared/event/contracts/EntryReceptionCreateContract';

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
  isPublic: boolean;
  raceSchedules: RaceScheduleRequest[];
}

export interface PublishEventResponseDto {
  eventId: string;
  eventName: string;
  isPublic: boolean;
}

export type EntryReceptionClassTemplateDto = EntryReceptionClassTemplateContract;

export type EntryReceptionRaceDefaultsDto = EntryReceptionRaceDefaultsContract;

export type EntryReceptionCreationDefaultsResponse = EntryReceptionCreationDefaultsContractResponse;

export type EntryReceptionPreparationResponse = EntryReceptionPreparationContractResponse;

export type RegisterEntryReceptionRequestDto = RegisterEntryReceptionRequest;

export interface EntryReceptionCreateResponseDto {
  eventId: string;
  entryReceptionId: string;
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

function readViteEnvVar(key: string): string | undefined {
  const env = readImportMetaEnv();

  if (env) {
    const value = env[key as keyof typeof env] ?? env[key];

    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

function readImportMetaEnv(): Record<string, unknown> | undefined {
  try {
    // eslint-disable-next-line no-eval -- import.meta は eval を介して参照し、テスト環境では存在しないため例外を握りつぶす。
    const meta = eval('import.meta') as { env?: Record<string, unknown> } | undefined;

    if (meta && typeof meta === 'object' && typeof meta.env === 'object') {
      return meta.env;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function resolveApiBaseUrl(): string {
  const fromProcess = typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : undefined;
  const fromGlobal = (globalThis as Record<string, unknown> | undefined)?.VITE_API_BASE_URL as string | undefined;
  const fromVite = readViteEnvVar('VITE_API_BASE_URL');
  const raw = fromProcess ?? fromGlobal ?? fromVite ?? '';

  return raw.replace(/\/+$/, '');
}

function resolveOrganizerId(): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env?.VITE_ORGANIZER_ID : undefined;
  const fromGlobal = (globalThis as Record<string, unknown> | undefined)?.VITE_ORGANIZER_ID as string | undefined;
  const fromVite = readViteEnvVar('VITE_ORGANIZER_ID');
  const raw = fromProcess ?? fromGlobal ?? fromVite;

  if (typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function parseEventSummaryListResponse(
  response: Response,
  payload: unknown,
  failureMessage: string
): EventSummaryListResponse {
  try {
    return eventSummaryListResponseSchema.parse(payload);
  } catch (error) {
    throw new EventApiError(failureMessage, response.status, error);
  }
}

export async function fetchEventCreationDefaults(signal?: AbortSignal): Promise<EventCreationDefaultsResponse> {
  const response = await fetch(buildApiUrl('/events/defaults'), {
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

export async function fetchOrganizerEvents(
  signal?: AbortSignal
): Promise<EventSummaryListResponse> {
  const organizerId = resolveOrganizerId();

  if (!organizerId) {
    throw new EventApiError(
      '主催者ID設定が必要です。環境変数 VITE_ORGANIZER_ID を設定してください。',
      400,
      { reason: 'MISSING_ORGANIZER_ID' }
    );
  }

  const response = await fetch(buildApiUrl(`/events?organizerId=${encodeURIComponent(organizerId)}`), {
    method: 'GET',
    signal
  });

  const payload = await handleResponse<unknown>(response);

  return parseEventSummaryListResponse(
    response,
    payload,
    'イベント一覧のレスポンス解析に失敗しました。'
  );
}

export async function fetchPublicEvents(
  signal?: AbortSignal
): Promise<EventSummaryListResponse> {
  const response = await fetch(buildApiUrl('/public/events'), {
    method: 'GET',
    signal
  });

  const payload = await handleResponse<unknown>(response);

  return parseEventSummaryListResponse(
    response,
    payload,
    '公開イベント一覧のレスポンス解析に失敗しました。'
  );
}

export async function fetchOrganizerEventDetail(
  eventId: string,
  signal?: AbortSignal
): Promise<OrganizerEventDetailResponse> {
  if (!eventId || eventId.trim().length === 0) {
    throw new EventApiError('イベントIDを指定してください。', 400, {
      reason: 'MISSING_EVENT_ID'
    });
  }

  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}`), {
    method: 'GET',
    signal
  });

  const payload = await handleResponse<unknown>(response);

  try {
    return organizerEventDetailResponseSchema.parse(payload);
  } catch (error) {
    throw new EventApiError('イベント詳細のレスポンス解析に失敗しました。', response.status, error);
  }
}

export async function fetchPublicEventDetail(
  eventId: string,
  signal?: AbortSignal
): Promise<PublicEventDetailResponse> {
  if (!eventId || eventId.trim().length === 0) {
    throw new EventApiError('イベントIDを指定してください。', 400, {
      reason: 'MISSING_EVENT_ID'
    });
  }

  const response = await fetch(buildApiUrl(`/public/events/${encodeURIComponent(eventId)}`), {
    method: 'GET',
    signal
  });

  const payload = await handleResponse<unknown>(response);

  try {
    return publicEventDetailResponseSchema.parse(payload);
  } catch (error) {
    throw new EventApiError('公開イベント詳細のレスポンス解析に失敗しました。', response.status, error);
  }
}

export async function postPublishEvent(
  eventId: string,
  signal?: AbortSignal
): Promise<PublishEventResponseDto> {
  if (!eventId || eventId.trim().length === 0) {
    throw new EventApiError('イベントIDを指定してください。', 400, {
      reason: 'MISSING_EVENT_ID'
    });
  }

  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}/publish`), {
    method: 'POST',
    headers: JSON_HEADERS,
    signal
  });

  return handleResponse<PublishEventResponseDto>(response);
}

export async function fetchEntryReceptionCreationDefaults(
  eventId: string,
  signal?: AbortSignal
): Promise<EntryReceptionCreationDefaultsResponse> {
  if (!eventId || eventId.trim().length === 0) {
    throw new EventApiError('イベントIDを指定してください。', 400, {
      reason: 'MISSING_EVENT_ID'
    });
  }

  const response = await fetch(
    buildApiUrl(`/events/${encodeURIComponent(eventId)}/entry-receptions/create`),
    {
      method: 'GET',
      signal
    }
  );

  const payload = await handleResponse<unknown>(response);

  try {
    return entryReceptionCreationDefaultsResponseSchema.parse(payload);
  } catch (error) {
    throw new EventApiError('エントリー受付初期値のレスポンス解析に失敗しました。', response.status, error);
  }
}

export async function fetchEntryReceptionPreparation(
  eventId: string,
  signal?: AbortSignal
): Promise<EntryReceptionPreparationResponse> {
  if (!eventId || eventId.trim().length === 0) {
    throw new EventApiError('イベントIDを指定してください。', 400, {
      reason: 'MISSING_EVENT_ID'
    });
  }

  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}/entry-receptions`), {
    method: 'GET',
    signal
  });

  const payload = await handleResponse<unknown>(response);

  try {
    return entryReceptionPreparationResponseSchema.parse(payload);
  } catch (error) {
    throw new EventApiError('エントリー受付情報のレスポンス解析に失敗しました。', response.status, error);
  }
}

export async function postEntryReception(
  eventId: string,
  dto: RegisterEntryReceptionRequestDto,
  signal?: AbortSignal
): Promise<EntryReceptionCreateResponseDto> {
  if (!eventId || eventId.trim().length === 0) {
    throw new EventApiError('イベントIDを指定してください。', 400, {
      reason: 'MISSING_EVENT_ID'
    });
  }

  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}/entry-receptions`), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(dto),
    signal
  });

  return handleResponse<EntryReceptionCreateResponseDto>(response);
}
