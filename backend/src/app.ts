import cors from 'cors';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';

import {
  EntryReceptionController,
  EventController,
  PublicEventController,
  StartListController
} from './event/adapter/in/web';
import CreateEventUseCase from './event/application/command/CreateEventUseCase';
import PublishEventUseCase from './event/application/command/PublishEventUseCase';
import GetEventCreationDefaultsQueryHandler from './event/application/query/GetEventCreationDefaultsQueryHandler';
import GetOrganizerEventDetailQueryHandler from './event/application/query/GetOrganizerEventDetailQueryHandler';
import ListOrganizerEventsQueryHandler from './event/application/query/ListOrganizerEventsQueryHandler';
import ListPublicEventsQueryHandler from './event/application/query/participant/ListPublicEventsQueryHandler';
import GetPublicEventDetailQueryHandler from './event/application/query/participant/GetPublicEventDetailQueryHandler';
import { createDataSource, DataSourceFactoryOptions } from './event/infrastructure/config/createDataSource';
import TypeOrmEventListQueryRepository from './event/infrastructure/repository/TypeOrmEventListQueryRepository';
import TypeOrmEventDetailQueryRepository from './event/infrastructure/repository/TypeOrmEventDetailQueryRepository';
import TypeOrmEventRepository from './event/infrastructure/repository/TypeOrmEventRepository';
import TypeOrmPublicEventListQueryRepository from './event/infrastructure/repository/TypeOrmPublicEventListQueryRepository';
import TypeOrmPublicEventDetailQueryRepository from './event/infrastructure/repository/TypeOrmPublicEventDetailQueryRepository';
import RegisterEntryReceptionUseCase from './entryReception/application/command/RegisterEntryReceptionUseCase';
import GetEntryReceptionPreparationQueryHandler from './entryReception/application/query/GetEntryReceptionPreparationQueryHandler';
import GetEntryReceptionCreationDefaultsQueryHandler from './entryReception/application/query/GetEntryReceptionCreationDefaultsQueryHandler';
import TypeOrmEntryReceptionRepository from './entryReception/infrastructure/repository/TypeOrmEntryReceptionRepository';
import TypeOrmEntryReceptionQueryRepository from './entryReception/infrastructure/repository/TypeOrmEntryReceptionQueryRepository';
import TypeOrmEventScheduleQueryRepository from './entryReception/infrastructure/repository/TypeOrmEventScheduleQueryRepository';
import TypeOrmEntryReceptionCreationDefaultsQueryRepository from './entryReception/infrastructure/repository/TypeOrmEntryReceptionCreationDefaultsQueryRepository';
import GetParticipantEntryOptionsQueryHandler from './participantEntry/application/query/GetParticipantEntryOptionsQueryHandler';
import ListParticipantEntriesQueryHandler from './participantEntry/application/query/ListParticipantEntriesQueryHandler';
import SubmitParticipantEntryCommandHandler from './participantEntry/application/command/SubmitParticipantEntryCommandHandler';
import ParticipantEntryFactory from './participantEntry/domain/ParticipantEntryFactory';
import ParticipantEntryAcceptanceService from './participantEntry/domain/service/ParticipantEntryAcceptanceService';
import TypeOrmPublicEntryReceptionQueryRepository from './participantEntry/infrastructure/repository/TypeOrmPublicEntryReceptionQueryRepository';
import TypeOrmParticipantEntryRepository from './participantEntry/infrastructure/repository/TypeOrmParticipantEntryRepository';
import TypeOrmParticipantEntryQueryRepository from './participantEntry/infrastructure/repository/TypeOrmParticipantEntryQueryRepository';
import ConfigureStartListUseCase from './startList/application/command/ConfigureStartListUseCase';
import AssignClassesToLanesUseCase from './startList/application/command/AssignClassesToLanesUseCase';
import ScheduleParticipantsUseCase from './startList/application/command/ScheduleParticipantsUseCase';
import FinalizeStartListUseCase from './startList/application/command/FinalizeStartListUseCase';
import GetStartListDraftQueryHandler from './startList/application/query/GetStartListDraftQueryHandler';
import TypeOrmStartListRepository from './startList/infrastructure/repository/TypeOrmStartListRepository';
import TypeOrmEntryReceptionForStartListQueryRepository from './startList/infrastructure/query/TypeOrmEntryReceptionForStartListQueryRepository';
import TypeOrmParticipantEntriesForStartListQueryRepository from './startList/infrastructure/query/TypeOrmParticipantEntriesForStartListQueryRepository';

export interface ApplicationDependencies {
  readonly eventDataSource: DataSource;
}

function assembleEventModule(app: Express, dependencies: ApplicationDependencies): void {
  const eventRepository = new TypeOrmEventRepository(dependencies.eventDataSource);
  const publishEventUseCase = new PublishEventUseCase(eventRepository);
  const eventListQueryRepository = new TypeOrmEventListQueryRepository(dependencies.eventDataSource);
  const publicEventListQueryRepository = new TypeOrmPublicEventListQueryRepository(
    dependencies.eventDataSource
  );
  const publicEventDetailQueryRepository = new TypeOrmPublicEventDetailQueryRepository(
    dependencies.eventDataSource
  );
  const eventDetailQueryRepository = new TypeOrmEventDetailQueryRepository(dependencies.eventDataSource);
  const createEventUseCase = new CreateEventUseCase(eventRepository, publishEventUseCase);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const listEventsQueryHandler = new ListOrganizerEventsQueryHandler(eventListQueryRepository);
  const listPublicEventsQueryHandler = new ListPublicEventsQueryHandler(publicEventListQueryRepository);
  const getPublicEventDetailQueryHandler = new GetPublicEventDetailQueryHandler(
    publicEventDetailQueryRepository
  );
  const eventDetailQueryHandler = new GetOrganizerEventDetailQueryHandler(eventDetailQueryRepository);
  const entryReceptionRepository = new TypeOrmEntryReceptionRepository(dependencies.eventDataSource);
  const eventScheduleQueryRepository = new TypeOrmEventScheduleQueryRepository(dependencies.eventDataSource);
  const entryReceptionPreparationQueryRepository = new TypeOrmEntryReceptionQueryRepository(
    dependencies.eventDataSource
  );
  const entryReceptionCreationDefaultsQueryRepository =
    new TypeOrmEntryReceptionCreationDefaultsQueryRepository(dependencies.eventDataSource);
  const registerEntryReceptionUseCase = new RegisterEntryReceptionUseCase(
    entryReceptionRepository,
    eventScheduleQueryRepository
  );
  const getEntryReceptionPreparationQueryHandler = new GetEntryReceptionPreparationQueryHandler(
    entryReceptionPreparationQueryRepository
  );
  const getEntryReceptionCreationDefaultsQueryHandler = new GetEntryReceptionCreationDefaultsQueryHandler(
    entryReceptionCreationDefaultsQueryRepository
  );
  const publicEntryReceptionQueryRepository = new TypeOrmPublicEntryReceptionQueryRepository(
    dependencies.eventDataSource
  );
  const participantEntryAcceptanceService = new ParticipantEntryAcceptanceService();
  const participantEntryFactory = new ParticipantEntryFactory(participantEntryAcceptanceService);
  const participantEntryRepository = new TypeOrmParticipantEntryRepository(
    dependencies.eventDataSource
  );
  const participantEntryQueryRepository = new TypeOrmParticipantEntryQueryRepository(
    dependencies.eventDataSource
  );
  const getParticipantEntryOptionsQueryHandler = new GetParticipantEntryOptionsQueryHandler(
    publicEntryReceptionQueryRepository
  );
  const submitParticipantEntryCommandHandler = new SubmitParticipantEntryCommandHandler(
    participantEntryRepository,
    publicEntryReceptionQueryRepository,
    participantEntryFactory
  );
  const listParticipantEntriesQueryHandler = new ListParticipantEntriesQueryHandler(
    participantEntryQueryRepository
  );
  const startListRepository = new TypeOrmStartListRepository(dependencies.eventDataSource);
  const entryReceptionForStartListQueryRepository =
    new TypeOrmEntryReceptionForStartListQueryRepository(dependencies.eventDataSource);
  const participantEntriesForStartListQueryRepository =
    new TypeOrmParticipantEntriesForStartListQueryRepository(dependencies.eventDataSource);
  const configureStartListUseCase = new ConfigureStartListUseCase(startListRepository);
  const assignClassesToLanesUseCase = new AssignClassesToLanesUseCase(
    startListRepository,
    entryReceptionForStartListQueryRepository
  );
  const scheduleParticipantsUseCase = new ScheduleParticipantsUseCase(
    startListRepository,
    participantEntriesForStartListQueryRepository
  );
  const finalizeStartListUseCase = new FinalizeStartListUseCase(startListRepository);
  const getStartListDraftQueryHandler = new GetStartListDraftQueryHandler(startListRepository);
  const eventController = new EventController(
    createEventUseCase,
    defaultsQueryHandler,
    listEventsQueryHandler,
    eventDetailQueryHandler,
    publishEventUseCase
  );
  const publicEventController = new PublicEventController(
    listPublicEventsQueryHandler,
    getPublicEventDetailQueryHandler,
    getParticipantEntryOptionsQueryHandler,
    submitParticipantEntryCommandHandler
  );
  const entryReceptionController = new EntryReceptionController(
    registerEntryReceptionUseCase,
    getEntryReceptionPreparationQueryHandler,
    getEntryReceptionCreationDefaultsQueryHandler,
    listParticipantEntriesQueryHandler
  );
  const startListController = new StartListController(
    configureStartListUseCase,
    assignClassesToLanesUseCase,
    scheduleParticipantsUseCase,
    finalizeStartListUseCase,
    getStartListDraftQueryHandler
  );

  app.use(publicEventController.router);
  app.use(entryReceptionController.router);
  app.use(startListController.router);
  app.use(eventController.router);
}

function buildExpressApp(dependencies: ApplicationDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  assembleEventModule(app, dependencies);

  return app;
}

async function initializeDependencies(
  options: DataSourceFactoryOptions
): Promise<ApplicationDependencies> {
  const eventDataSource = await createDataSource(options);
  return { eventDataSource };
}

export async function createApp(
  options: DataSourceFactoryOptions = {}
): Promise<Express> {
  try {
    const dependencies = await initializeDependencies(options);
    return buildExpressApp(dependencies);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('アプリケーションの初期化に失敗しました。', error);
    throw error;
  }
}

export { buildExpressApp as createAppWithDependencies };

export default createApp;
