import { fetchPublicEvents } from '../../api/eventApi';
import {
  createEventListServiceFactory,
  type EventListGateway as ParticipantEventListGateway,
  type EventListServiceFactory as ParticipantEventListServiceFactory,
  type EventListServiceState as ParticipantEventListServiceState,
  type UseEventListServiceOptions as UseParticipantEventListServiceOptions
} from '../common/eventListServiceFactory';

const FALLBACK_ERROR_MESSAGE = '公開イベント一覧の取得に失敗しました。';

export const useParticipantEventListService: ParticipantEventListServiceFactory = createEventListServiceFactory({
  defaultFetchEvents: fetchPublicEvents,
  fallbackErrorMessage: FALLBACK_ERROR_MESSAGE
});

export type {
  ParticipantEventListGateway,
  ParticipantEventListServiceFactory,
  ParticipantEventListServiceState,
  UseParticipantEventListServiceOptions
};

export default useParticipantEventListService;
