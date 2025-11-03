import { fetchOrganizerEvents } from '../api/eventApi';
import {
  createEventListServiceFactory,
  type EventListGateway as OrganizerEventListGateway,
  type EventListServiceFactory as OrganizerEventListServiceFactory,
  type EventListServiceState as OrganizerEventListServiceState,
  type UseEventListServiceOptions as UseOrganizerEventListServiceOptions
} from './common/eventListServiceFactory';

const FALLBACK_ERROR_MESSAGE = 'イベント一覧の取得に失敗しました。';

export const useOrganizerEventListService: OrganizerEventListServiceFactory = createEventListServiceFactory({
  defaultFetchEvents: fetchOrganizerEvents,
  fallbackErrorMessage: FALLBACK_ERROR_MESSAGE
});

export type { OrganizerEventListGateway, OrganizerEventListServiceState, UseOrganizerEventListServiceOptions };

export default useOrganizerEventListService;
