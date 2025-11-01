export class ListOrganizerEventsQuery {
  private constructor(public readonly organizerId: string) {}

  public static forOrganizer(organizerId: string): ListOrganizerEventsQuery {
    const normalized = organizerId?.trim();

    if (!normalized) {
      throw new Error('主催者IDを指定してください。');
    }

    return new ListOrganizerEventsQuery(normalized);
  }
}

export default ListOrganizerEventsQuery;
