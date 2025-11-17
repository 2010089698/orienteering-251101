import { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UseFormReturn, useForm } from 'react-hook-form';

import ParticipantEntryCreatePage from '../create/ParticipantEntryCreatePage';
import type {
  ParticipantEntryCreateFormValues,
  ParticipantEntryCreateServiceFactory,
  ParticipantEntryCreateServiceState
} from '../create/application/useParticipantEntryCreateService';

interface StubFactoryOptions {
  state?: Partial<Omit<ParticipantEntryCreateServiceState, 'register' | 'formState' | 'onSubmit'>>;
  onSubmit?: jest.Mock;
  configureForm?: (form: UseFormReturn<ParticipantEntryCreateFormValues>) => void;
  invokeOnSuccess?: boolean;
}

function createStubServiceFactory(options: StubFactoryOptions = {}): ParticipantEntryCreateServiceFactory {
  return ({ onSuccess }) => {
    const form = useForm<ParticipantEntryCreateFormValues>();

    useEffect(() => {
      options.configureForm?.(form);
    }, [form]);

    const submitHandler: ParticipantEntryCreateServiceState['onSubmit'] = (event) => {
      event.preventDefault();
      options.onSubmit?.();
      if (options.invokeOnSuccess) {
        onSuccess?.();
      }
      return Promise.resolve();
    };

    return {
      register: form.register,
      formState: form.formState,
      races: [],
      classes: [],
      eventName: '',
      loading: false,
      loadError: null,
      optionsError: null,
      submitError: null,
      isSubmitting: false,
      onSelectRace: jest.fn(),
      onSubmit: submitHandler,
      retry: jest.fn(),
      resetSubmitError: jest.fn(),
      ...options.state
    } satisfies ParticipantEntryCreateServiceState;
  };
}

describe('ParticipantEntryCreatePage', () => {
  it('読み込み中の状態を表示する', () => {
    const serviceFactory = createStubServiceFactory({
      state: { loading: true }
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1/entries/new']}>
        <Routes>
          <Route path="/public/events/:eventId/entries/new" element={<ParticipantEntryCreatePage serviceFactory={serviceFactory} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toHaveTextContent('読み込み中...');
  });

  it('読み込みエラー時に再読み込みボタンを表示してハンドラを呼び出す', () => {
    const retryMock = jest.fn();
    const serviceFactory = createStubServiceFactory({
      state: {
        loading: false,
        loadError: '情報を取得できませんでした。',
        retry: retryMock
      }
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1/entries/new']}>
        <Routes>
          <Route path="/public/events/:eventId/entries/new" element={<ParticipantEntryCreatePage serviceFactory={serviceFactory} />} />
        </Routes>
      </MemoryRouter>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('情報を取得できませんでした。');

    fireEvent.click(screen.getByRole('button', { name: '再読み込み' }));
    expect(retryMock).toHaveBeenCalledTimes(1);
  });

  it('レース選択時にエラーメッセージをリセットし、ハンドラに値を渡す', () => {
    const resetSubmitErrorMock = jest.fn();
    const onSelectRaceMock = jest.fn();

    const serviceFactory = createStubServiceFactory({
      state: {
        races: [
          {
            raceId: 'race-1',
            raceName: 'レース1',
            raceDate: '2024-06-01',
            isSelectable: true,
            isSelected: false,
            isLoading: false,
            error: null,
            assistanceText: null
          }
        ],
        classes: [
          { classId: 'class-1', name: 'クラス1', capacityLabel: null },
          { classId: 'class-2', name: 'クラス2', capacityLabel: '定員: 10名' }
        ],
        resetSubmitError: resetSubmitErrorMock,
        onSelectRace: onSelectRaceMock
      }
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1/entries/new']}>
        <Routes>
          <Route path="/public/events/:eventId/entries/new" element={<ParticipantEntryCreatePage serviceFactory={serviceFactory} />} />
        </Routes>
      </MemoryRouter>
    );

    const raceRadio = screen.getByLabelText('レース1（2024-06-01）') as HTMLInputElement;
    fireEvent.click(raceRadio);

    expect(onSelectRaceMock).toHaveBeenCalledWith('race-1');
    expect(resetSubmitErrorMock).toHaveBeenCalled();

    const classSelect = screen.getByLabelText('エントリークラス');
    fireEvent.change(classSelect, { target: { value: 'class-2' } });

    expect(resetSubmitErrorMock).toHaveBeenCalledTimes(2);
  });

  it('送信成功時にナビゲーションが行われる', async () => {
    const onSubmitMock = jest.fn();
    const serviceFactory = createStubServiceFactory({
      onSubmit: onSubmitMock,
      invokeOnSuccess: true,
      state: {
        races: [
          {
            raceId: 'race-1',
            raceName: 'レース1',
            raceDate: '2024-06-01',
            isSelectable: true,
            isSelected: true,
            isLoading: false,
            error: null,
            assistanceText: null
          }
        ],
        classes: [{ classId: 'class-1', name: 'クラス1', capacityLabel: null }],
        eventName: '公開イベント'
      }
    });

    render(
      <MemoryRouter initialEntries={['/public/events/event-1/entries/new']}>
        <Routes>
          <Route path="/public/events/:eventId/entries/new" element={<ParticipantEntryCreatePage serviceFactory={serviceFactory} />} />
          <Route path="/public/events/:eventId" element={<p>イベント詳細ページ</p>} />
        </Routes>
      </MemoryRouter>
    );

    const participantName = await screen.findByRole('textbox', { name: '氏名' });
    fireEvent.change(participantName, { target: { value: '参加者 太郎' } });
    const participantEmail = screen.getByRole('textbox', { name: 'メールアドレス' });
    fireEvent.change(participantEmail, { target: { value: 'taro@example.com' } });

    const form = participantName.closest('form');
    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(onSubmitMock).toHaveBeenCalled();
    expect(await screen.findByText('イベント詳細ページ')).toBeInTheDocument();
  });

  it('メールアドレスのバリデーションエラーを表示する', async () => {
    const serviceFactory = createStubServiceFactory({
      configureForm: (form) => {
        form.setError('participant.email', {
          type: 'manual',
          message: 'メールアドレスは必須です。'
        });
      }
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/public/events/event-1/entries/new']}>
          <Routes>
            <Route
              path="/public/events/:eventId/entries/new"
              element={<ParticipantEntryCreatePage serviceFactory={serviceFactory} />}
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(await screen.findByText('メールアドレスは必須です。')).toBeInTheDocument();
  });
});
