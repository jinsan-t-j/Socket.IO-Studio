import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { ViteSSG } from "vite-ssg";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import App from "./App.vue";
import "./styles.css";

// ViteSSG is used to enable Static Site Generation (SSG), which resolves
// hydration issues and "localStorage is not defined" errors during the build.
export const createApp = ViteSSG(
  App,
  // ViteSSG requires a routes array to determine which pages to pre-render.
  // Since this is a Single Page App (SPA) where App.vue contains the entire UI,
  // we use a dummy component for the "/" path to trigger the build for index.html.
  { routes: [{ path: "/", component: { render: () => null } }] },
  ({ app }) => {
    const pinia = createPinia();

    // Only register the persistence plugin on the client side.
    // This prevents errors during the SSR/SSG build phase where 'window' is undefined.
    if (!import.meta.env.SSR) {
      pinia.use(piniaPluginPersistedstate);
    }

    app.use(pinia);
  },
);
