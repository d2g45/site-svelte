import { defineEnvVars } from '@sveltejs/kit/env'

export const variables = defineEnvVars({
  PUBLIC_UMAMI_ID: { public: true, schema: (input) => input ?? '' },
})
