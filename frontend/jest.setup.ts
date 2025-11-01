import '@testing-library/jest-dom';
import 'whatwg-fetch';

if (process.env.VITE_API_BASE_URL === undefined) {
  process.env.VITE_API_BASE_URL = '';
}

(globalThis as Record<string, unknown>).VITE_API_BASE_URL = process.env.VITE_API_BASE_URL;
