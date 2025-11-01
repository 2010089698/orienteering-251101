import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['**/backend/test/**/*.test.ts'],
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      }
    },
    {
      displayName: 'frontend',
      rootDir: '<rootDir>/frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', useESM: true }]
      },
      moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/../shared/$1'
      }
    }
  ]
};

export default config;
