import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EntryReceptionCreatePage from '../EntryReceptionCreatePage';
import {
  EntryReceptionCreateServiceFactory,
  EntryReceptionCreateServiceGateway,
  useEntryReceptionCreateService
} from '../application/useEntryReceptionCreateService';
import { EventApiError } from '../../../api/eventApi';
import type { EntryReceptionCreationDefaultsResponse } from '@shared/event/contracts/EntryReceptionCreationDefaultsContract';

const DEFAULT_GATEWAY_RESPONSE: EntryReceptionCreationDefaultsResponse = {
  eventId: 'EVT-001',
  eventName: '春の大会',
  eventEndDate: '2024-04-02T12:00',
  races: [
    {
      raceId: 'RACE-1',
      raceName: 'Day1 Sprint',
      defaultReceptionStart: '2024-04-01T08:00',
      defaultReceptionEnd: '2024-04-01T09:00',
      classTemplates: [
        { classId: 'CLS-1', name: 'M21E', capacity: 50 }
      ]
    },
    {
      raceId: 'RACE-2',
      raceName: 'Day2 Middle',
      defaultReceptionStart: '2024-04-02T08:30',
      defaultReceptionEnd: '2024-04-02T09:30',
      classTemplates: []
    }
  ]
};

const renderPage = (
  gatewayOverrides?: Partial<EntryReceptionCreateServiceGateway>
) => {
  const fetchDefaults =
    gatewayOverrides?.fetchDefaults ??
    jest
      .fn<ReturnType<EntryReceptionCreateServiceGateway['fetchDefaults']>, Parameters<EntryReceptionCreateServiceGateway['fetchDefaults']>>()
      .mockResolvedValue(DEFAULT_GATEWAY_RESPONSE);
  const createEntryReception =
    gatewayOverrides?.createEntryReception ??
    jest
      .fn<
        ReturnType<EntryReceptionCreateServiceGateway['createEntryReception']>,
        Parameters<EntryReceptionCreateServiceGateway['createEntryReception']>
      >()
      .mockResolvedValue({ eventId: 'EVT-001', entryReceptionId: 'ERC-001' });

  const gateway: EntryReceptionCreateServiceGateway = {
    fetchDefaults,
    createEntryReception
  };

  const serviceFactory: EntryReceptionCreateServiceFactory = (options) =>
    useEntryReceptionCreateService({
      ...options,
      gateway
    });

  const renderResult = render(
    <MemoryRouter initialEntries={['/events/EVT-001/entry-receptions/create']}>
      <Routes>
        <Route
          path="/events/:eventId/entry-receptions/create"
          element={<EntryReceptionCreatePage serviceFactory={serviceFactory} />}
        />
        <Route path="/events/:eventId" element={<div>ダミーイベント詳細</div>} />
      </Routes>
    </MemoryRouter>
  );

  return { fetchDefaults, createEntryReception, renderResult };
};

async function fillRequiredClassFields(user: ReturnType<typeof userEvent.setup>) {
  const secondRaceRegion = await screen.findByRole('region', {
    name: 'Day2 Middleの受付設定'
  });
  const secondRaceClassId = within(secondRaceRegion).getByLabelText('クラスID');
  const secondRaceClassName = within(secondRaceRegion).getByLabelText('クラス名');
  await user.type(secondRaceClassId, 'CLS-2');
  await user.type(secondRaceClassName, 'W21A');
}

describe('EntryReceptionCreatePage', () => {
  test('エントリー受付を登録して詳細画面へ遷移する', async () => {
    const { createEntryReception } = renderPage();
    const user = userEvent.setup();

    await screen.findByText('対象イベント: 春の大会');

    const firstRaceRegion = screen.getByRole('region', {
      name: 'Day1 Sprintの受付設定'
    });
    const secondRaceRegion = screen.getByRole('region', {
      name: 'Day2 Middleの受付設定'
    });

    const firstRaceClassIdInputs = within(firstRaceRegion).getAllByLabelText('クラスID');
    expect(firstRaceClassIdInputs[0]).toHaveValue('CLS-1');

    const firstRaceClassNameInputs = within(firstRaceRegion).getAllByLabelText('クラス名');
    expect(firstRaceClassNameInputs[0]).toHaveValue('M21E');

    const secondRaceClassId = within(secondRaceRegion).getByLabelText('クラスID');
    await user.type(secondRaceClassId, 'CLS-2');
    const secondRaceClassName = within(secondRaceRegion).getByLabelText('クラス名');
    await user.type(secondRaceClassName, 'W21A');
    const secondRaceCapacity = within(secondRaceRegion).getByLabelText('定員');
    await user.type(secondRaceCapacity, '40');

    const addClassButton = within(firstRaceRegion).getByRole('button', { name: 'クラスを追加' });
    await user.click(addClassButton);

    const updatedClassIdInputs = within(firstRaceRegion).getAllByLabelText('クラスID');
    const newClassIdInput = updatedClassIdInputs[updatedClassIdInputs.length - 1];
    await user.type(newClassIdInput, 'CLS-NEW');

    const updatedClassNameInputs = within(firstRaceRegion).getAllByLabelText('クラス名');
    const newClassNameInput = updatedClassNameInputs[updatedClassNameInputs.length - 1];
    await user.type(newClassNameInput, '新人講習');

    const updatedCapacityInputs = within(firstRaceRegion).getAllByLabelText('定員');
    await user.type(updatedCapacityInputs[updatedCapacityInputs.length - 1], '30');

    await user.click(screen.getByRole('button', { name: '登録完了' }));

    await waitFor(() => expect(createEntryReception).toHaveBeenCalledTimes(2));

    const [firstCallEventId, firstRequest] = createEntryReception.mock.calls[0];
    expect(firstCallEventId).toBe('EVT-001');
    expect(firstRequest).toEqual({
      raceId: 'RACE-1',
      receptionStart: '2024-04-01T08:00',
      receptionEnd: '2024-04-01T09:00',
      entryClasses: [
        { classId: 'CLS-1', name: 'M21E', capacity: 50 },
        { classId: 'CLS-NEW', name: '新人講習', capacity: 30 }
      ]
    });

    const [secondCallEventId, secondRequest] = createEntryReception.mock.calls[1];
    expect(secondCallEventId).toBe('EVT-001');
    expect(secondRequest).toEqual({
      raceId: 'RACE-2',
      receptionStart: '2024-04-02T08:30',
      receptionEnd: '2024-04-02T09:30',
      entryClasses: [{ classId: 'CLS-2', name: 'W21A', capacity: 40 }]
    });

    await waitFor(() => expect(screen.getByText('ダミーイベント詳細')).toBeInTheDocument());
  });

  test('クラスID未入力の場合はエラーを表示し送信しない', async () => {
    const { createEntryReception } = renderPage();
    const user = userEvent.setup();

    await screen.findByText('対象イベント: 春の大会');

    const secondRaceRegion = screen.getByRole('region', {
      name: 'Day2 Middleの受付設定'
    });

    const secondRaceClassName = within(secondRaceRegion).getByLabelText('クラス名');
    await user.type(secondRaceClassName, 'W21A');

    await user.click(screen.getByRole('button', { name: '登録完了' }));

    await waitFor(() =>
      expect(within(secondRaceRegion).getByText('クラスIDを入力してください。')).toBeInTheDocument()
    );
    expect(createEntryReception).not.toHaveBeenCalled();
  });

  test('受付終了日時がイベント終了日時を超えるとエラーになる', async () => {
    const { createEntryReception } = renderPage();
    const user = userEvent.setup();

    await screen.findByText('対象イベント: 春の大会');

    const secondRaceRegion = screen.getByRole('region', {
      name: 'Day2 Middleの受付設定'
    });

    const secondRaceClosing = within(secondRaceRegion).getByLabelText('受付終了');
    // max属性が存在するとブラウザが値変更を拒否するためテストでは除去する。
    secondRaceClosing.removeAttribute('max');
    fireEvent.change(secondRaceClosing, {
      target: { value: '2024-04-02T12:30', name: 'receptions.1.closesAt' }
    });
    expect(secondRaceClosing).toHaveValue('2024-04-02T12:30');

    await fillRequiredClassFields(user);

    await user.click(screen.getByRole('button', { name: '登録完了' }));

    await waitFor(() =>
      expect(
        within(secondRaceRegion).getByText('受付終了日時はイベント終了日時以前を指定してください。')
      ).toBeInTheDocument()
    );
    expect(createEntryReception).not.toHaveBeenCalled();
  });

  test('APIバリデーションエラー時にメッセージを表示する', async () => {
    const createEntryReception = jest
      .fn<
        ReturnType<EntryReceptionCreateServiceGateway['createEntryReception']>,
        Parameters<EntryReceptionCreateServiceGateway['createEntryReception']>
      >()
      .mockRejectedValue(
        new EventApiError('validation failed', 422, { message: '入力内容を確認してください。' })
      );

    renderPage({ createEntryReception });
    const user = userEvent.setup();

    await screen.findByText('対象イベント: 春の大会');
    await fillRequiredClassFields(user);

    await user.click(screen.getByRole('button', { name: '登録完了' }));

    await waitFor(() =>
      expect(screen.getByText('入力内容を確認してください。')).toBeInTheDocument()
    );
  });

  test('APIエラー時に共通エラーメッセージを表示する', async () => {
    const createEntryReception = jest
      .fn<
        ReturnType<EntryReceptionCreateServiceGateway['createEntryReception']>,
        Parameters<EntryReceptionCreateServiceGateway['createEntryReception']>
      >()
      .mockRejectedValue(new EventApiError('サーバーエラー', 500));

    renderPage({ createEntryReception });
    const user = userEvent.setup();

    await screen.findByText('対象イベント: 春の大会');
    await fillRequiredClassFields(user);

    await user.click(screen.getByRole('button', { name: '登録完了' }));

    await waitFor(() =>
      expect(screen.getByText('エントリー受付の登録に失敗しました。')).toBeInTheDocument()
    );
  });

  test('初期設定取得失敗時に再読み込みできる', async () => {
    const fetchDefaults = jest
      .fn<ReturnType<EntryReceptionCreateServiceGateway['fetchDefaults']>, Parameters<EntryReceptionCreateServiceGateway['fetchDefaults']>>()
      .mockRejectedValueOnce(new EventApiError('失敗', 500))
      .mockResolvedValue(DEFAULT_GATEWAY_RESPONSE);

    renderPage({ fetchDefaults });
    const user = userEvent.setup();

    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: '再読み込み' }));

    await waitFor(() => expect(fetchDefaults).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('対象イベント: 春の大会')).toBeInTheDocument());
  });
});

describe('EntryReceptionCreatePage sequential submission', () => {
  function createDeferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve, reject };
  }

  test('複数レースの受付登録を逐次実行する', async () => {
    const firstCall = createDeferred<{ eventId: string; entryReceptionId: string }>();
    const createEntryReception = jest
      .fn<
        ReturnType<EntryReceptionCreateServiceGateway['createEntryReception']>,
        Parameters<EntryReceptionCreateServiceGateway['createEntryReception']>
      >()
      .mockImplementationOnce(() => firstCall.promise)
      .mockImplementationOnce(() => Promise.resolve({ eventId: 'EVT-001', entryReceptionId: 'ERC-002' }));

    renderPage({ createEntryReception });
    const user = userEvent.setup();

    await screen.findByText('対象イベント: 春の大会');
    await fillRequiredClassFields(user);

    await user.click(screen.getByRole('button', { name: '登録完了' }));

    await waitFor(() => expect(createEntryReception).toHaveBeenCalledTimes(1));

    firstCall.resolve({ eventId: 'EVT-001', entryReceptionId: 'ERC-001' });

    await waitFor(() => expect(createEntryReception).toHaveBeenCalledTimes(2));
  });
});

