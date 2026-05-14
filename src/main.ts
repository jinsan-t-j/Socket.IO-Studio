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

export const createApp = ViteSSG(
  App,
  { routes: [{ path: "/", component: () => import("./App.vue") }] },
  ({ app }) => {
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    app.use(pinia);
  },
);
