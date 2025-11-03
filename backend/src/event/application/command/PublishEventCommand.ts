export interface PublishEventCommandProps {
  readonly eventId: string;
}

export class PublishEventCommand {
  private constructor(private readonly props: PublishEventCommandProps) {}

  public static forEvent(eventId: string): PublishEventCommand {
    if (!eventId || eventId.trim() === '') {
      throw new Error('公開対象のイベントIDを指定してください。');
    }

    return new PublishEventCommand({ eventId: eventId.trim() });
  }

  public get eventId(): string {
    return this.props.eventId;
  }
}

export default PublishEventCommand;
