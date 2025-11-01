import { fetchEventCreationDefaults, postCreateEvent, EventApiError } from '../eventApi';
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
      organizerId: 'ORG-001',
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
});
