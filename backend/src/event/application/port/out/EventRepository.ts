import Event from '../../../domain/Event';

/**
 * 永続化の詳細に依存しないイベントリポジトリのポート。
 */
export interface EventRepository {
  save(event: Event): Promise<void>;
}

export default EventRepository;
