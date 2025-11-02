import {
  fetchEventCreationDefaults,
  postCreateEvent,
  EventApiError,
  fetchOrganizerEvents
} from '../eventApi';
import type { CreateEventRequest } from '@shared/event/contracts/CreateEventContract';

describe('eventApi handleResponse', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
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
    const response = new Response(JSON.stringify({ invalid: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    global.fetch = jest.fn().mockResolvedValue(response);

    await expect(fetchOrganizerEvents()).rejects.toBeInstanceOf(EventApiError);
  });

  test('イベント一覧APIが妥当なリストを返した場合は整形済みデータを受け取る', async () => {
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
