import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { DataSource } from 'typeorm';

import { createDataSource } from '../../src/event/infrastructure/config/createDataSource';

export interface SqliteTestDataSourceFixture {
  readonly dataSource: DataSource;
  readonly databasePath: string;
  cleanup(): Promise<void>;
}

export async function createSqliteTestDataSource(): Promise<SqliteTestDataSourceFixture> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'event-sqlite-test-'));
  const databasePath = join(temporaryDirectory, 'event.sqlite');
  const dataSource = await createDataSource({
    resetDatabase: true,
    databasePath
  });

  let cleanedUp = false;

  return {
    dataSource,
    databasePath,
    cleanup: async () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;

      try {
        if (dataSource.isInitialized) {
          await dataSource.destroy();
        }
      } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    }
  };
}
