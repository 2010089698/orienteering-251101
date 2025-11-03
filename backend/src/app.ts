import cors from 'cors';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';

import { EventController, PublicEventController } from './event/adapter/in/web';
import CreateEventUseCase from './event/application/command/CreateEventUseCase';
import PublishEventUseCase from './event/application/command/PublishEventUseCase';
import GetEventCreationDefaultsQueryHandler from './event/application/query/GetEventCreationDefaultsQueryHandler';
import GetOrganizerEventDetailQueryHandler from './event/application/query/GetOrganizerEventDetailQueryHandler';
import ListOrganizerEventsQueryHandler from './event/application/query/ListOrganizerEventsQueryHandler';
import ListPublicEventsQueryHandler from './event/application/query/participant/ListPublicEventsQueryHandler';
import { createDataSource, DataSourceFactoryOptions } from './event/infrastructure/config/createDataSource';
import TypeOrmEventListQueryRepository from './event/infrastructure/repository/TypeOrmEventListQueryRepository';
import TypeOrmEventDetailQueryRepository from './event/infrastructure/repository/TypeOrmEventDetailQueryRepository';
import TypeOrmEventRepository from './event/infrastructure/repository/TypeOrmEventRepository';
import TypeOrmPublicEventListQueryRepository from './event/infrastructure/repository/TypeOrmPublicEventListQueryRepository';

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
  const eventDetailQueryRepository = new TypeOrmEventDetailQueryRepository(dependencies.eventDataSource);
  const createEventUseCase = new CreateEventUseCase(eventRepository, publishEventUseCase);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const listEventsQueryHandler = new ListOrganizerEventsQueryHandler(eventListQueryRepository);
  const listPublicEventsQueryHandler = new ListPublicEventsQueryHandler(publicEventListQueryRepository);
  const eventDetailQueryHandler = new GetOrganizerEventDetailQueryHandler(eventDetailQueryRepository);
  const eventController = new EventController(
    createEventUseCase,
    defaultsQueryHandler,
    listEventsQueryHandler,
    eventDetailQueryHandler,
    publishEventUseCase
  );
  const publicEventController = new PublicEventController(listPublicEventsQueryHandler);

  app.use(publicEventController.router);
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
