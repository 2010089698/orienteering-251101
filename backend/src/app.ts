import cors from 'cors';
import express, { Express } from 'express';

import { EventController } from './event/adapter/in/web';
import CreateEventUseCase from './event/application/command/CreateEventUseCase';
import GetEventCreationDefaultsQueryHandler from './event/application/query/GetEventCreationDefaultsQueryHandler';
import TypeOrmEventRepository, {
  DataSourceLike
} from './event/infrastructure/repository/TypeOrmEventRepository';

export interface ApplicationDependencies {
  readonly eventDataSource: DataSourceLike;
}

function assembleEventModule(app: Express, dependencies: ApplicationDependencies): void {
  const eventRepository = new TypeOrmEventRepository(dependencies.eventDataSource);
  const createEventUseCase = new CreateEventUseCase(eventRepository);
  const defaultsQueryHandler = new GetEventCreationDefaultsQueryHandler();
  const eventController = new EventController(createEventUseCase, defaultsQueryHandler);

  app.use(eventController.router);
}

export function createApp(dependencies: ApplicationDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  assembleEventModule(app, dependencies);

  return app;
}

export default createApp;
