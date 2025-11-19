import StartListDraft from '../../domain/StartListDraft';
import StartListSettings from '../../domain/StartListSettings';
import StartListRepository from '../port/out/StartListRepository';
import ConfigureStartListCommand from './ConfigureStartListCommand';

class ConfigureStartListUseCase {
  public constructor(private readonly repository: StartListRepository) {}

  public async execute(command: ConfigureStartListCommand): Promise<StartListDraft> {
    const startAt = this.parseDate(command.startDateTime);
    const settings = StartListSettings.configure(
      startAt,
      command.intervalSeconds,
      command.laneCount
    );

    const existing = await this.repository.findByEventAndRace(command.eventId, command.raceId);
    const draft = existing
      ? existing.reconfigure(settings)
      : StartListDraft.initialize({
          eventId: command.eventId,
          raceId: command.raceId,
          settings,
        });

    await this.repository.save(draft);
    return draft;
  }

  private parseDate(value: string): Date {
    if (!value?.trim()) {
      throw new Error('開始日時を指定してください。');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('開始日時の形式が不正です。');
    }
    return parsed;
  }
}

export default ConfigureStartListUseCase;
