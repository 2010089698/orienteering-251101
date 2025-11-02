import {
  fetchEventCreationDefaults,
  postCreateEvent,
  EventApiError,
  fetchOrganizerEvents
} from '../eventApi';
import type { CreateEventRequest } from '@shared/event/contracts/CreateEventContract';

describe('eventApi handleResponse', () => {
  const originalFetch = global.fetch;
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    delete process.env.VITE_ORGANIZER_ID;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV as NodeJS.ProcessEnv;
  });

  test('204 No Content 応答は契約違反として扱う', async () => {
    const response = new Response(null, { status: 204, statusText: 'No Content' });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchEventCreationDefaults()).rejects.toBeInstanceOf(EventApiError);
  });

  test('空のJSONボディは契約違反として扱う', async () => {
    const response = new Response('', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchEventCreationDefaults()).rejects.toBeInstanceOf(EventApiError);
  });

  test('妥当なJSONボディはドメイン契約を満たす', async () => {
    const payload = {
      dateFormat: 'YYYY-MM-DD',
      timezone: 'Asia/Tokyo',
      minRaceSchedules: 1,
      maxRaceSchedules: 3,
      requireEndDateForMultipleRaces: true
    };

    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchEventCreationDefaults()).resolves.toEqual(payload);
  });

  test('イベント作成APIが空レスポンスを返した場合は例外を投げる', async () => {
    const requestBody: CreateEventRequest = {
      eventId: 'EVT-001',
      eventName: 'テストイベント',
      startDate: '2024-04-01',
      endDate: '2024-04-02',
      raceSchedules: [{ name: 'Day1', date: '2024-04-01' }]
    };

    const response = new Response(null, { status: 201, statusText: 'Created' });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(postCreateEvent(requestBody)).rejects.toBeInstanceOf(EventApiError);
  });

  test('イベント一覧APIが契約に反するレスポンスを返した場合は例外を投げる', async () => {
    process.env.VITE_ORGANIZER_ID = 'organizer-default';
    const response = new Response(JSON.stringify({ invalid: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchOrganizerEvents()).rejects.toBeInstanceOf(EventApiError);
  });

  test('主催者IDが設定されていない場合は例外を投げる', async () => {
    global.fetch = jest.fn();

    await expect(fetchOrganizerEvents()).rejects.toThrow(
      '主催者ID設定が必要です。環境変数 VITE_ORGANIZER_ID を設定してください。'
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('主催者IDをクエリパラメーターとして利用する', async () => {
    process.env.VITE_ORGANIZER_ID = 'organizer-123';
    const payload: unknown[] = [];
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    const fetchMock = jest.fn().mockResolvedValue(response);
    global.fetch = fetchMock;

    await fetchOrganizerEvents();

    expect(fetchMock).toHaveBeenCalledWith('/api/events?organizerId=organizer-123', {
      method: 'GET',
      signal: undefined
    });
  });

  test('イベント一覧APIが妥当なリストを返した場合は整形済みデータを受け取る', async () => {
    process.env.VITE_ORGANIZER_ID = 'organizer-default';
    const payload = [
      {
        eventId: 'EVT-001',
        eventName: '春の大会',
        startDate: '2024-04-01',
        endDate: '2024-04-02',
        isMultiDayEvent: true,
        isMultiRaceEvent: false
      }
    ];
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchOrganizerEvents()).resolves.toEqual(payload);
  });
});
