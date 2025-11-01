import { createDataSource } from '../event/infrastructure/config/createDataSource';

async function resetDatabase(): Promise<void> {
  const dataSource = await createDataSource({ resetDatabase: true });
  await dataSource.destroy();
}

void resetDatabase().catch((error) => {
  console.error('Failed to reset database:', error);
  process.exitCode = 1;
});
