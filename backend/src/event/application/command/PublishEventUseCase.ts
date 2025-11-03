import EventRepository from '../port/out/EventRepository';
import PublishEventCommand from './PublishEventCommand';
import Event from '../../domain/Event';

export class PublishEventUseCase {
  public constructor(private readonly eventRepository: EventRepository) {}

  public async execute(command: PublishEventCommand): Promise<Event> {
    const eventId = command.eventId;
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new Error('指定されたイベントが見つかりません。');
    }

    event.publish();
    await this.eventRepository.save(event);

    return event;
  }
}

export default PublishEventUseCase;
