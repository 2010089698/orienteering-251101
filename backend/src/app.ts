import cors from 'cors';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';

import {
  EntryReceptionController,
  EventController,
  PublicEventController
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
import TypeOrmEntryReceptionRepository from './entryReception/infrastructure/repository/TypeOrmEntryReceptionRepository';
import TypeOrmEntryReceptionQueryRepository from './entryReception/infrastructure/repository/TypeOrmEntryReceptionQueryRepository';
import TypeOrmEventScheduleQueryRepository from './entryReception/infrastructure/repository/TypeOrmEventScheduleQueryRepository';

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
  const registerEntryReceptionUseCase = new RegisterEntryReceptionUseCase(
    entryReceptionRepository,
    eventScheduleQueryRepository
  );
  const getEntryReceptionPreparationQueryHandler = new GetEntryReceptionPreparationQueryHandler(
    entryReceptionPreparationQueryRepository
  );
  const eventController = new EventController(
    createEventUseCase,
    defaultsQueryHandler,
    listEventsQueryHandler,
    eventDetailQueryHandler,
    publishEventUseCase
  );
  const publicEventController = new PublicEventController(
    listPublicEventsQueryHandler,
    getPublicEventDetailQueryHandler
  );
  const entryReceptionController = new EntryReceptionController(
    registerEntryReceptionUseCase,
    getEntryReceptionPreparationQueryHandler
  );

  app.use(publicEventController.router);
  app.use(entryReceptionController.router);
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
