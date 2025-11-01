import path from 'node:path';

export class BackendPort {
  private constructor(private readonly port: number) {}

  public static from(value: string | undefined): BackendPort {
    if (!value) {
      return new BackendPort(3000);
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('BACKEND_PORT は正の整数で指定してください。');
    }

    return new BackendPort(parsed);
  }

  public get value(): number {
    return this.port;
  }
}

export class DatabasePath {
  private constructor(private readonly filePath: string) {}

  public static from(value: string | undefined): DatabasePath {
    const normalized = value?.trim();

    if (normalized && normalized.length > 0) {
      return new DatabasePath(path.resolve(normalized));
    }

    return new DatabasePath(DatabasePath.defaultPath());
  }

  private static defaultPath(): string {
    return path.resolve('var', 'data', 'orienteering.sqlite');
  }

  public get value(): string {
    return this.filePath;
  }
}

export interface BackendEnvironment {
  readonly port: BackendPort;
  readonly databasePath: DatabasePath;
}

export function loadEnvironment(env: NodeJS.ProcessEnv): BackendEnvironment {
  const port = BackendPort.from(env.BACKEND_PORT);
  const databasePath = DatabasePath.from(env.EVENT_DATABASE_PATH ?? env.DATABASE_PATH);

  return { port, databasePath };
}
