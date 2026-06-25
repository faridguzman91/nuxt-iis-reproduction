export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  app: {
    // Simulates an IIS sub-path deployment: the app lives at /myapp/ not /.
    // In production this is set via NUXT_APP_BASE_URL env var at build time.
    baseURL: process.env.NUXT_APP_BASE_URL || '/myapp/',
  },
})
