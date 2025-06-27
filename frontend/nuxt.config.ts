import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL
    }
  },
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css', '~/assets/css/main.css'],
  build: {
    transpile: ['vuetify']
  },
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    plugins: [
      tailwindcss(),
    ],
  },
});