import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/backend/test/**/*.test.ts']
    },
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['**/frontend/src/**/*.test.ts', '**/frontend/src/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/frontend/jest.setup.ts']
    }
  ]
};

export default config;
