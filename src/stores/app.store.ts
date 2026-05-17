import { defineStore } from "pinia";
import { toRaw } from "vue";

import type {
  AuthConfig,
  DockPosition,
  KeyValueRow,
  ListenerRule,
  RequestTab,
  SavedSession,
  ScriptConfig,
  SocketOptionsConfig,
  SocketSessionDraft,
  SocketTransport,
  WorkspaceLogEntry,
  EditorMode,
  EmitPreset,
} from "@/types/app";
import { connectSocket, disconnectSocket, emitEvent } from "@/utils/socketManager";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return structuredClone(toRaw(value)) as T;
}

function createKeyValueRow(key = "", value = ""): KeyValueRow {
  return { id: id("kv"), key, value, enabled: true };
}

function createAuth(): AuthConfig {
  return {
    type: "none",
    bearerToken: "",
    username: "",
    password: "",
    apiKeyName: "",
    apiKeyValue: "",
    handshakeAuthJson: "{\n  \"token\": \"\"\n}",
  };
}

function createOptions(): SocketOptionsConfig {
  return {
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: false,
    forceNew: true,
    multiplex: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
    withCredentials: false,
    autoUnref: false,
    timestampRequests: false,
    timestampParam: "t",
    perMessageDeflate: true,
    parser: "default",
  };
}

function createScripts(): ScriptConfig {
  return {
    preConnect: `// Pre-connect notes
// Use this area for connection prep and validation.
`,
    postEvent: `// Post-event notes
// Use this area for read-only event handling.
`,
  };
}

function createListeners(): ListenerRule[] {
  return [
    { id: id("listener"), eventName: "connect", enabled: true, color: "#10b981" },
    { id: id("listener"), eventName: "disconnect", enabled: true, color: "#ef4444" },
    { id: id("listener"), eventName: "[ANY]", enabled: true, color: "#06b6d4" },
  ];
}

export function createDraft(): SocketSessionDraft {
  return {
    url: "http://localhost:5001",
    path: "/socket.io",
    namespace: "/",
    version: 4,
    headers: [createKeyValueRow("Authorization", "Bearer "), createKeyValueRow("X-Request-ID", "req-001")],
    queryParams: [createKeyValueRow("EIO", "4")],
    auth: createAuth(),
    options: createOptions(),
    scripts: createScripts(),
    emitters: [
      { id: id("emitter"), eventName: "join", payload: "{\n  \"room\": \"lobby\"\n}", volatile: false, compress: false },
    ],
    listeners: createListeners(),
    editorModes: {
      headers: "form",
      query: "form",
      auth: "form",
      options: "form",
      scripts: "form",
    },
  };
}

function createSession(name: string, color: string, folder?: string, draft?: SocketSessionDraft): SavedSession {
  return {
    id: id("session"),
    name,
    color,
    folder,
    draft: draft ? clone(draft) : createDraft(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createTabFromSession(session: SavedSession): RequestTab {
  return {
    id: id("tab"),
    name: session.name,
    sourceSessionId: session.id,
    draft: clone(session.draft),
    dirty: false,
    createdAt: Date.now(),
    runtime: {
      status: "idle",
    },
    logs: [],
  };
}

function createBlankTab(): RequestTab {
  return {
    id: id("tab"),
    name: "New request",
    draft: createDraft(),
    dirty: false,
    createdAt: Date.now(),
    runtime: {
      status: "idle",
    },
    logs: [],
  };
}

const defaultSessions = [
  createSession("Example Session", "#10b981", "Workspace"),
];

const defaultTabs = [createTabFromSession(defaultSessions[0]), createBlankTab()];

interface WorkspaceState {
  brand: string;
  layoutDock: DockPosition;
  sessions: SavedSession[];
  tabs: RequestTab[];
  activeTabId: string;
  panelSize: number;
}

async function requestPersistence() {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      await navigator.storage.persist();
    }
  }
}

export const useAppStore = defineStore("app", {
  persist: true,
  state: (): WorkspaceState => ({
    brand: "Socket.IO Studio",
    layoutDock: "right",
    sessions: defaultSessions,
    tabs: defaultTabs,
    activeTabId: defaultTabs[0].id,
    panelSize: 300,
  }),
  getters: {
    activeTab(state): RequestTab | undefined {
      return state.tabs.find((tab) => tab.id === state.activeTabId);
    },
    activeSession(state): SavedSession | undefined {
      const tab = state.tabs.find((item) => item.id === state.activeTabId);
      return tab?.sourceSessionId ? state.sessions.find((session) => session.id === tab.sourceSessionId) : undefined;
    },
    openTabs(state): RequestTab[] {
      return state.tabs;
    },
  },
  actions: {
    async init() {
      await requestPersistence();
      // Patch existing tabs from persistence that might be missing logs array
      this.tabs.forEach(tab => {
        if (!tab.logs) tab.logs = [];
      });
    },
    log(kind: WorkspaceLogEntry["kind"], title: string, detail: string, targetTabId?: string) {
      const tabId = targetTabId || this.activeTabId;
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return;

      // Safety check for persisted tabs missing logs field
      if (!tab.logs) tab.logs = [];

      tab.logs = [
        {
          id: id("log"),
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          kind,
          title,
          detail,
        },
        ...tab.logs,
      ].slice(0, 120);

    },
    clearLogs(targetTabId?: string) {
      const tabId = targetTabId || this.activeTabId;
      const tab = this.tabs.find(t => t.id === tabId);
      if (tab) tab.logs = [];

    },
    deleteSession(sessionId: string) {
      const index = this.sessions.findIndex((s) => s.id === sessionId);
      if (index === -1) return;
      this.sessions.splice(index, 1);
      
      const tabsToClose = this.tabs.filter(t => t.sourceSessionId === sessionId);
      tabsToClose.forEach(t => this.closeTab(t.id));
      

    },
    renameSession(sessionId: string, newName: string) {
      const session = this.sessions.find(s => s.id === sessionId);
      if (!session) return;
      session.name = newName;
      
      // Update linked tabs
      this.tabs.forEach(t => {
        if (t.sourceSessionId === sessionId) {
          t.name = newName;
        }
      });
      

    },
    duplicateSession(sessionId: string) {
      const session = this.sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      const copy = createSession(`${session.name} copy`, session.color, session.folder, clone(session.draft));
      this.sessions.unshift(copy);

    },
    deleteMultipleSessions(sessionIds: string[]) {
      this.sessions = this.sessions.filter(s => !sessionIds.includes(s.id));
      const tabsToClose = this.tabs.filter(t => t.sourceSessionId && sessionIds.includes(t.sourceSessionId));
      tabsToClose.forEach(t => this.closeTab(t.id));

    },
    reorderSessions(sessionIds: string[]) {
      const sorted = [...this.sessions].sort((a, b) => {
        return sessionIds.indexOf(a.id) - sessionIds.indexOf(b.id);
      });
      this.sessions = sorted;

    },
    selectTab(tabId: string) {
      this.activeTabId = tabId;

    },
    createTab() {
      const tab = createBlankTab();
      this.tabs.unshift(tab);
      this.activeTabId = tab.id;

    },
    closeTab(tabId: string) {
      const index = this.tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return;

      const wasActive = this.activeTabId === tabId;
      this.tabs.splice(index, 1);

      if (wasActive && this.tabs.length > 0) {
        this.activeTabId = this.tabs[0].id;
      }

    },
    openSession(sessionId: string) {
      const existingTab = this.tabs.find((t) => t.sourceSessionId === sessionId);
      if (existingTab) {
        this.activeTabId = existingTab.id;

        return;
      }

      const session = this.sessions.find((item) => item.id === sessionId);
      if (!session) return;
      const tab = createTabFromSession(session);
      this.tabs.unshift(tab);
      this.activeTabId = tab.id;

    },
    duplicateTab(tabId: string) {
      const tab = this.tabs.find((item) => item.id === tabId);
      if (!tab) return;
      const duplicate: RequestTab = {
        id: id("tab"),
        name: `${tab.name} copy`,
        sourceSessionId: tab.sourceSessionId,
        draft: clone(tab.draft),
        dirty: true,
        createdAt: Date.now(),
        runtime: { status: "idle" },
        logs: [],
      };
      this.tabs.unshift(duplicate);
      this.activeTabId = duplicate.id;

    },
    renameTab(tabId: string, name: string) {
      const tab = this.tabs.find((item) => item.id === tabId);
      if (!tab) return;
      tab.name = name;
      this.saveTab(tabId);
    },
    updatePanelSize(size: number) {
      this.panelSize = size;

    },
    toggleDock() {
      this.layoutDock = this.layoutDock === "right" ? "bottom" : "right";

    },
    updateConnectionField(field: keyof Pick<SocketSessionDraft, "url" | "path" | "namespace" | "version">, value: string | number, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (tab) {
        tab.draft = {
          ...tab.draft,
          [field]: value
        };
        this.autosave(tabId);
      }
    },
    updateEditorMode(section: keyof SocketSessionDraft["editorModes"], mode: EditorMode, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.editorModes = { ...tab.draft.editorModes, [section]: mode };
      this.autosave(tabId);
    },
    addHeaderRow(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.headers.push(createKeyValueRow());
      this.autosave(tabId);
    },
    addQueryRow(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.queryParams.push(createKeyValueRow());
      this.autosave(tabId);
    },
    addListener(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.listeners.unshift({
        id: id("listener"),
        eventName: "",
        enabled: true,
        color: "#3b82f6",
      });
      this.autosave(tabId);
    },
    addEmitter(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.emitters.unshift({
        id: id("emitter"),
        eventName: "",
        payload: "{\n  \"message\": \"hello\"\n}",
        volatile: false,
        compress: false,
      });
      this.autosave(tabId);
    },
    toggleHeader(idValue: string, enabled: boolean, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      const row = tab?.draft.headers.find((item) => item.id === idValue);
      if (!row || !tab) return;
      row.enabled = enabled;
      this.autosave(tabId);
    },
    updateHeader(idValue: string, patch: Partial<KeyValueRow>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      const header = tab?.draft.headers.find(h => h.id === idValue);
      if (header && tab) {
        const index = tab.draft.headers.indexOf(header);
        tab.draft.headers[index] = { ...header, ...patch };
        this.autosave(tabId);
      }
    },
    updateQuery(idValue: string, patch: Partial<KeyValueRow>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      const query = tab?.draft.queryParams.find(q => q.id === idValue);
      if (query && tab) {
        const index = tab.draft.queryParams.indexOf(query);
        tab.draft.queryParams[index] = { ...query, ...patch };
        this.autosave(tabId);
      }
    },
    updateAuth(patch: Partial<AuthConfig>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.auth = { ...tab.draft.auth, ...patch };
      this.autosave(tabId);
    },
    updateOptions(patch: Partial<SocketOptionsConfig>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.options = { ...tab.draft.options, ...patch };
      this.autosave(tabId);
    },
    updateScripts(patch: Partial<ScriptConfig>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft.scripts = { ...tab.draft.scripts, ...patch };
      this.autosave(tabId);
    },
    updateListener(idValue: string, patch: Partial<ListenerRule>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      const listener = tab?.draft.listeners.find(l => l.id === idValue);
      if (listener && tab) {
        const index = tab.draft.listeners.indexOf(listener);
        tab.draft.listeners[index] = { ...listener, ...patch };
        this.autosave(tabId);
      }
    },
    updateEmitter(idValue: string, patch: Partial<EmitPreset>, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      const emitter = tab?.draft.emitters.find(e => e.id === idValue);
      if (emitter && tab) {
        const index = tab.draft.emitters.indexOf(emitter);
        tab.draft.emitters[index] = { ...emitter, ...patch };
        this.autosave(tabId);
      }
    },
    removeEmitter(idValue: string, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      const index = tab.draft.emitters.findIndex((item) => item.id === idValue);
      if (index !== -1) {
        tab.draft.emitters.splice(index, 1);
        this.autosave(tabId);
      }
    },
    removeHeaderRow(idValue: string, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      const index = tab.draft.headers.findIndex((item) => item.id === idValue);
      if (index !== -1) {
        tab.draft.headers.splice(index, 1);
        this.autosave(tabId);
      }
    },
    removeQueryRow(idValue: string, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      const index = tab.draft.queryParams.findIndex((item) => item.id === idValue);
      if (index !== -1) {
        tab.draft.queryParams.splice(index, 1);
        this.autosave(tabId);
      }
    },
    removeListener(idValue: string, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      const index = tab.draft.listeners.findIndex((item) => item.id === idValue);
      if (index !== -1) {
        tab.draft.listeners.splice(index, 1);
        this.autosave(tabId);
      }
    },
    emitActiveTabEvent(emitter: EmitPreset) {
      const tab = this.activeTab;
      if (tab?.runtime.status !== "connected") return;
      
      emitEvent(tab.id, emitter.eventName, emitter.payload, emitter.volatile, emitter.compress);
      this.log("tab", "EMIT", `${emitter.eventName}: ${emitter.payload}`, tab.id);
    },
    toggleTransport(transport: SocketTransport, enabled: boolean, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      const current = new Set(tab.draft.options.transports);
      if (enabled) current.add(transport);
      else current.delete(transport);
      tab.draft.options = {
        ...tab.draft.options,
        transports: Array.from(current)
      };
      this.autosave(tabId);
    },
    replaceDraftFromJson(section: "headers" | "queryParams" | "auth" | "options" | "scripts", raw: string, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      try {
        if (section === "headers" || section === "queryParams") {
          const parsed = JSON.parse(raw) as KeyValueRow[];
          tab.draft = {
            ...tab.draft,
            [section]: parsed.map((item) => ({ ...item, id: item.id || id("kv"), enabled: item.enabled ?? true }))
          };
        } else {
          tab.draft = {
            ...tab.draft,
            [section]: JSON.parse(raw)
          };
        }
        this.autosave(tabId);
      } catch (error) {
        this.log("error", "Invalid JSON", error instanceof Error ? error.message : "Unable to parse JSON.", tab.id);
      }
    },
    resetActiveTab(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.draft = createDraft();
      this.autosave(tabId);
    },
    replaceFullDraft(raw: string, tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      try {
        tab.draft = JSON.parse(raw);
        this.autosave(tabId);
      } catch (error) {
        this.log("error", "Invalid Config JSON", error instanceof Error ? error.message : "Unable to parse JSON.", tab.id);
      }
    },
    saveActiveTab() {
      if (this.activeTabId) {
        this.saveTab(this.activeTabId);
      }
    },
    saveTab(tabId: string) {
      const tab = this.tabs.find(t => t.id === tabId);
      if (!tab) return;
      const name = tab.name.trim() || "Untitled Session";
      tab.name = name;
      tab.dirty = false;
      const existing = tab.sourceSessionId ? this.sessions.find((item) => item.id === tab.sourceSessionId) : undefined;
      if (existing) {
        existing.name = name;
        existing.draft = clone(tab.draft);
        existing.updatedAt = Date.now();
      } else {
        const session = createSession(name, "#3b82f6", "Workspace", tab.draft);
        tab.sourceSessionId = session.id;
        this.sessions.unshift(session);
      }
    },
    autosave(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      tab.dirty = true;
    },
    saveActiveTabAsFile() {
      const tab = this.activeTab;
      if (!tab || globalThis.window === undefined) return;
      const payload = JSON.stringify(
        {
          version: 1,
          savedAt: Date.now(),
          session: tab.sourceSessionId ? this.sessions.find((item) => item.id === tab.sourceSessionId) ?? null : null,
          tab: tab,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${tab.name || "Socket.IO Studio-session"}.Socket.IO Studio.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    connectTab(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      if (tab.runtime.status === "connected" || tab.runtime.status === "connecting") return;

      // 1. Check for Mixed Content Incompatibility
      const url = tab.draft.url;
      const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");

      if (globalThis.window?.location.protocol === "https:" && (url.startsWith("http:") || url.startsWith("ws:"))) {
        const msg = "Security Block: This app is running on HTTPS, but trying to connect to an insecure HTTP/WS server. Most browsers will block this 'Mixed Content'. Use HTTPS for your server or run this app locally on HTTP.";

        if (!isLocalhost) {
          tab.runtime.status = "error";
          tab.runtime.lastError = msg;
          this.log("error", "Mixed Content Block", msg, tab.id);
          return;
        }

        // For localhost, log a warning but allow the connection attempt to proceed
        this.log("error", "Mixed Content Warning", "You are connecting from HTTPS to an insecure localhost server. If the connection fails, it is likely due to browser 'Mixed Content' policies. Run this app on HTTP to resolve.", tab.id);
      }

      tab.runtime.status = "connecting";
      tab.runtime.lastError = undefined;
      const tid = tab.id;
      this.log("tab", "Connecting", `Connecting ${tab.name} to ${tab.draft.url}.`, tid);
      connectSocket(tab.id, tab.draft, {
        onStatus: (runtime) => {
          tab.runtime = { ...tab.runtime, ...runtime };

        },
        onEvent: (event) => {
          this.log(event.kind === "error" ? "error" : "tab", event.kind.toUpperCase(), event.message, tid);

        },
        onAnyEvent: (name, args) => {
          this.log("tab", `EVENT ${name}`, JSON.stringify(args), tid);

        },
      });
    },
    disconnectTab(tabId?: string) {
      const tab = tabId ? this.tabs.find(t => t.id === tabId) : this.activeTab;
      if (!tab) return;
      disconnectSocket(tab.id);
      tab.runtime = { status: "idle" };
      this.log("tab", "Disconnected", `Disconnected ${tab.name}.`, tab.id);
    },
  },
});
