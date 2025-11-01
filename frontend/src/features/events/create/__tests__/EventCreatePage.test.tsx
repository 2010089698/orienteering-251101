import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCreatePage from '../EventCreatePage';
import { CreateEventRequestDto } from '../../api/eventApi';

const EVENTS_API_BASE_PATH = '/api/events';

const server = setupServer(
  rest.get(`${EVENTS_API_BASE_PATH}/create/defaults`, (_req, res, ctx) =>
    res(
      ctx.json({
        dateFormat: 'YYYY-MM-DD',
        timezone: 'UTC',
        minRaceSchedules: 1,
        maxRaceSchedules: 3,
        requireEndDateForMultipleRaces: true
      })
    )
  ),
  rest.post(EVENTS_API_BASE_PATH, (_req, res, ctx) =>
    res(
      ctx.status(201),
      ctx.json({
        eventId: 'E-001',
        eventName: 'テストイベント',
        startDate: '2024-04-01',
        endDate: '2024-04-02',
        isMultiDayEvent: true,
        isMultiRaceEvent: true,
        raceSchedules: [
          { name: 'Day1 Sprint', date: '2024-04-01' },
          { name: 'Day2 Middle', date: '2024-04-02' }
        ]
      })
    )
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/events/create']}>
      <Routes>
        <Route path="/events/create" element={<EventCreatePage />} />
        <Route path="/events" element={<div data-testid="events-list-page">イベント一覧</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('EventCreatePage', () => {
  test('複数日と複数レースの切替が可能である', async () => {
    renderPage();
    const user = userEvent.setup();

    const eventIdInput = await screen.findByLabelText('イベントID');
    expect(eventIdInput).toBeInTheDocument();

    const multiDayToggle = screen.getByLabelText('複数日イベント');
    expect(multiDayToggle).not.toBeChecked();

    await user.click(multiDayToggle);
    expect(multiDayToggle).toBeChecked();

    const endDateInput = screen.getByLabelText('イベント終了日');
    expect(endDateInput).not.toBeDisabled();

    const multiRaceToggle = screen.getByLabelText('複数レース');
    expect(multiRaceToggle).not.toBeChecked();

    await user.click(multiRaceToggle);
    expect(multiRaceToggle).toBeChecked();

    const addRaceButton = screen.getByRole('button', { name: 'レースを追加' });
    expect(addRaceButton).toBeEnabled();

    await user.click(addRaceButton);

    const raceGroups = screen.getAllByRole('group');
    expect(raceGroups).toHaveLength(2);
  });

  test('イベントを送信するとAPIが呼び出され一覧に遷移する', async () => {
    let receivedBody: CreateEventRequestDto | undefined;

    server.use(
      rest.post(EVENTS_API_BASE_PATH, async (req, res, ctx) => {
        receivedBody = (await req.json()) as CreateEventRequestDto;
        return res(
          ctx.status(201),
          ctx.json({
            eventId: 'E-001',
            eventName: 'テストイベント',
            startDate: '2024-04-01',
            endDate: '2024-04-02',
            isMultiDayEvent: true,
            isMultiRaceEvent: true,
            raceSchedules: [
              { name: 'Day1 Sprint', date: '2024-04-01' },
              { name: 'Day2 Middle', date: '2024-04-02' }
            ]
          })
        );
      })
    );

    renderPage();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('イベントID'), 'E-001');
    await user.type(screen.getByLabelText('イベント名'), '春のオリエンテーリング');
    fireEvent.change(screen.getByLabelText('イベント開始日'), { target: { value: '2024-04-01' } });

    const multiDayToggle = screen.getByLabelText('複数日イベント');
    await user.click(multiDayToggle);

    const multiRaceToggle = screen.getByLabelText('複数レース');
    await user.click(multiRaceToggle);

    const endDateInput = screen.getByLabelText('イベント終了日');
    fireEvent.change(endDateInput, { target: { value: '2024-04-02' } });

    const raceRows = screen.getAllByRole('group');
    await user.type(within(raceRows[0]).getByLabelText(/レース名/), 'Day1 Sprint');
    fireEvent.change(within(raceRows[0]).getByLabelText(/レース日程/), {
      target: { value: '2024-04-01' }
    });

    const addButton = screen.getByRole('button', { name: 'レースを追加' });
    await user.click(addButton);

    const updatedRaceRows = screen.getAllByRole('group');
    await user.type(within(updatedRaceRows[1]).getByLabelText(/レース名/), 'Day2 Middle');
    fireEvent.change(within(updatedRaceRows[1]).getByLabelText(/レース日程/), {
      target: { value: '2024-04-02' }
    });

    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(receivedBody).toBeDefined());
    expect(receivedBody).toMatchObject({
      eventId: 'E-001',
      eventName: '春のオリエンテーリング',
      startDate: '2024-04-01',
      endDate: '2024-04-02',
      raceSchedules: [
        { name: 'Day1 Sprint', date: '2024-04-01' },
        { name: 'Day2 Middle', date: '2024-04-02' }
      ]
    });

    await waitFor(() => expect(screen.getByTestId('events-list-page')).toBeInTheDocument());
  });

  test('キャンセルを押下すると一覧へ遷移する', async () => {
    renderPage();
    const user = userEvent.setup();

    const cancelButton = await screen.findByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);

    await waitFor(() => expect(screen.getByTestId('events-list-page')).toBeInTheDocument());
  });
});
