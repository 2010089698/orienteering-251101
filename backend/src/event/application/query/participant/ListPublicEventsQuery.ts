import PublicEventSearchCondition from './PublicEventSearchCondition';

export class ListPublicEventsQuery {
  private constructor(public readonly condition: PublicEventSearchCondition) {}

  public static create(condition: PublicEventSearchCondition): ListPublicEventsQuery {
    if (!condition) {
      throw new Error('検索条件を指定してください。');
    }

    return new ListPublicEventsQuery(condition);
  }
}

export default ListPublicEventsQuery;
