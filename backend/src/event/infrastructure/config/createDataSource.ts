import fs from 'node:fs/promises';
import path from 'node:path';

import { DataSource } from 'typeorm';

import { EventEntity } from '../repository/EventEntity';
import { RaceScheduleEntity } from '../repository/RaceScheduleEntity';

export interface DataSourceFactoryOptions {
  readonly databasePath?: string;
  readonly resetDatabase?: boolean;
}

function resolveDatabasePath(candidate?: string): string {
  if (candidate && candidate.trim().length > 0) {
    return path.resolve(candidate);
  }

  const envPath = process.env.DB_PATH;
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(envPath);
  }

  return path.resolve('var', 'data', 'dev.sqlite');
}

function shouldResetDatabase(option?: boolean): boolean {
  if (typeof option === 'boolean') {
    return option;
  }

  const resetFlag = process.env.RESET_DB;
  if (!resetFlag) {
    return false;
  }

  return resetFlag.toLowerCase() === 'true';
}

async function ensureDatabaseDirectory(filePath: string): Promise<void> {
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });
}

async function resetDatabaseIfRequested(databasePath: string, reset: boolean): Promise<void> {
  if (!reset) {
    return;
  }

  try {
    await fs.unlink(databasePath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function createDataSource(
  options: DataSourceFactoryOptions = {}
): Promise<DataSource> {
  const databasePath = resolveDatabasePath(options.databasePath);
  const reset = shouldResetDatabase(options.resetDatabase);

  await ensureDatabaseDirectory(databasePath);
  await resetDatabaseIfRequested(databasePath, reset);

  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [EventEntity, RaceScheduleEntity],
    synchronize: true,
  });

  return await dataSource.initialize();
}

export default createDataSource;
