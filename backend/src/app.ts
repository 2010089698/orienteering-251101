import cors from 'cors';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';

import { EventController } from './event/adapter/in/web';
import CreateEventUseCase from './event/application/command/CreateEventUseCase';
import GetEventCreationDefaultsQueryHandler from './event/application/query/GetEventCreationDefaultsQueryHandler';
import ListOrganizerEventsQueryHandler from './event/application/query/ListOrganizerEventsQueryHandler';
import { createDataSource, DataSourceFactoryOptions } from './event/infrastructure/config/createDataSource';
import TypeOrmEventListQueryRepository from './event/infrastructure/repository/TypeOrmEventListQueryRepository';
import TypeOrmEventRepository from './event/infrastructure/repository/TypeOrmEventRepository';

export interface ApplicationDependencies {
  readonly eventDataSource: DataSource;
}

function assembleEventModule(app: Express, dependencies: ApplicationDependencies): void {
  const eventRepository = new TypeOrmEventRepository(dependencies.eventDataSource);
  const eventListQueryRepository = new TypeOrmEventListQueryRepository(dependencies.eventDataSource);
  const createEventUseCase = new CreateEventUseCase(eventRepository);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const listEventsQueryHandler = new ListOrganizerEventsQueryHandler(eventListQueryRepository);
  const eventController = new EventController(
    createEventUseCase,
    defaultsQueryHandler,
    listEventsQueryHandler
  );

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
