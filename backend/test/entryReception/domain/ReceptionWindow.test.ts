import ReceptionWindow from '../../../src/entryReception/domain/ReceptionWindow';
import EventPeriod from '../../../src/event/domain/EventPeriod';

describe('ReceptionWindow', () => {
  const eventPeriod = EventPeriod.createFromBoundaries(
    new Date('2024-05-01T00:00:00.000Z'),
    new Date('2024-05-10T00:00:00.000Z')
  );

  it('イベント開始前から受付を開始してもイベント終了日以内であれば許容する', () => {
    const window = ReceptionWindow.create(
      new Date('2024-04-25T09:00:00.000Z'),
      new Date('2024-05-05T18:00:00.000Z')
    );

    expect(() => window.ensureWithin(eventPeriod)).not.toThrow();
  });

  it('受付開始がイベント終了日を超えるとエラーになる', () => {
    const window = ReceptionWindow.create(
      new Date('2024-05-11T09:00:00.000Z'),
      new Date('2024-05-12T10:00:00.000Z')
    );

    expect(() => window.ensureWithin(eventPeriod)).toThrow(
      '受付開始日時はイベント終了日を超えないように設定してください。'
    );
  });

  it('受付終了がイベント終了日を超えるとエラーになる', () => {
    const window = ReceptionWindow.create(
      new Date('2024-05-08T09:00:00.000Z'),
      new Date('2024-05-11T10:00:00.000Z')
    );

    expect(() => window.ensureWithin(eventPeriod)).toThrow(
      '受付終了日時はイベント終了日までに設定してください。'
    );
  });
});
