import 'reflect-metadata';

import dotenv from 'dotenv';

import { createApp } from './app';
import { BackendEnvironment, DatabasePath, loadEnvironment } from './config/environment';
import {
  DataSourceLike,
  EntityManagerLike
} from './event/infrastructure/repository/TypeOrmEventRepository';

dotenv.config({ path: '.env.development' });

class InMemoryEntityManager implements EntityManagerLike {
  public constructor(private readonly storage: unknown[]) {}

  public async save<T>(entity: T): Promise<T> {
    this.storage.push(entity);
    return entity;
  }
}

class InMemoryDataSource implements DataSourceLike {
  public constructor(private readonly storage: unknown[], private readonly databasePath: DatabasePath) {}

  public async transaction<T>(work: (manager: EntityManagerLike) => Promise<T>): Promise<T> {
    const manager = new InMemoryEntityManager(this.storage);
    return await work(manager);
  }
}

function createDataSource(databasePath: DatabasePath): DataSourceLike {
  return new InMemoryDataSource([], databasePath);
}

function bootstrap(): void {
  const environment: BackendEnvironment = loadEnvironment(process.env);
  const app = createApp({ eventDataSource: createDataSource(environment.databasePath) });

  const port = environment.port.value;

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server is running on port ${port}`);
  });
}

bootstrap();
