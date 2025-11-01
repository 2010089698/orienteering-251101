import 'reflect-metadata';

import path from 'node:path';

import dotenv from 'dotenv';

import { createApp } from './app';
import { BackendEnvironment, loadEnvironment } from './config/environment';

const envFilePath = path.resolve(__dirname, '../.env.development');

dotenv.config({ path: envFilePath });

async function bootstrap(): Promise<void> {
  const environment: BackendEnvironment = loadEnvironment(process.env);

  try {
    const app = await createApp({
      databasePath: environment.databasePath.value,
      resetDatabase: environment.resetDatabase.value,
    });

    const port = environment.port.value;

    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend server is running on port ${port}`);
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('バックエンドアプリケーションの起動に失敗しました。', error);
    process.exit(1);
  }
}

void bootstrap();
