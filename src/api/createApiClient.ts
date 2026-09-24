import type { ApiClient } from './ApiClient.ts'
import { createHttpClient } from './httpClient.ts'
import { createMockClient } from './mockClient.ts'

/** VITE_USE_MOCK=false switches to the real API, anything else keeps the fake data. */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const apiClient: ApiClient = useMock
  ? createMockClient()
  : createHttpClient(import.meta.env.VITE_API_URL ?? '')
