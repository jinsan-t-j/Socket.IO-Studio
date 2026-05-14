import { io, type Socket } from "socket.io-client";

import type { ConnectionRuntime, SocketSessionDraft, SocketTransport } from "@/types/app";

type ConnectionEvent = {
  kind: "connect" | "disconnect" | "log" | "error" | "runtime";
  message: string;
};

type Handlers = {
  onStatus: (runtime: Partial<ConnectionRuntime>) => void;
  onEvent: (event: ConnectionEvent) => void;
  onAnyEvent: (name: string, payload: unknown[]) => void;
};

const sockets = new Map<string, Socket>();

function buildHandshakeAuth(draft: SocketSessionDraft) {
  switch (draft.auth.type) {
    case "bearer":
      return draft.auth.bearerToken ? { token: draft.auth.bearerToken } : {};
    case "basic":
      return draft.auth.username || draft.auth.password
        ? { username: draft.auth.username, password: draft.auth.password }
        : {};
    case "api_key_header":
    case "api_key_query":
      return draft.auth.apiKeyName || draft.auth.apiKeyValue
        ? { [draft.auth.apiKeyName || "api_key"]: draft.auth.apiKeyValue }
        : {};
    case "handshake_auth":
      try {
        return JSON.parse(draft.auth.handshakeAuthJson) as Record<string, unknown>;
      } catch {
        return {};
      }
    default:
      return {};
  }
}

function buildQuery(draft: SocketSessionDraft) {
  return draft.queryParams
    .filter((row) => row.enabled)
    .reduce<Record<string, string>>((acc, row) => {
      if (row.key) acc[row.key] = row.value;
      return acc;
    }, {});
}

function buildTransports(draft: SocketSessionDraft): SocketTransport[] {
  return draft.options.transports;
}

export function connectSocket(
  tabId: string,
  draft: SocketSessionDraft,
  handlers: Handlers,
) {
  disconnectSocket(tabId);

  const namespace = draft.namespace && draft.namespace !== "/" ? draft.namespace : "";
  const baseUrl = `${draft.url.replace(/\/$/, "")}${namespace}`;
  const auth = buildHandshakeAuth(draft);
  const query = buildQuery(draft);
  const transportList = buildTransports(draft);

  handlers.onEvent({
    kind: "log",
    message: `[Handshake] Initializing connection\nURL: ${baseUrl}\nPath: ${draft.path || "/socket.io"}\nVersion: v${draft.version}\nTransports: ${transportList.join(", ")}\nAuth: ${JSON.stringify(auth)}\nQuery: ${JSON.stringify(query)}`,
  });

  const socket = io(baseUrl, {
    path: draft.path || "/socket.io",
    transports: transportList,
    upgrade: draft.options.upgrade,
    rememberUpgrade: draft.options.rememberUpgrade,
    forceNew: draft.options.forceNew,
    multiplex: draft.options.multiplex,
    reconnection: draft.options.reconnection,
    reconnectionAttempts: draft.options.reconnectionAttempts,
    reconnectionDelay: draft.options.reconnectionDelay,
    reconnectionDelayMax: draft.options.reconnectionDelayMax,
    randomizationFactor: draft.options.randomizationFactor,
    timeout: draft.options.timeout,
    withCredentials: draft.options.withCredentials,
    autoUnref: draft.options.autoUnref,
    timestampRequests: draft.options.timestampRequests,
    timestampParam: draft.options.timestampParam,
    auth,
    query,
  });

  sockets.set(tabId, socket);
  handlers.onStatus({ status: "connecting", lastError: undefined });

  // Engine transparency
  socket.io.on("open", () => {
    handlers.onEvent({ kind: "log", message: `[Engine] Transport ${socket.io.engine.transport.name} opened.` });
  });

  socket.io.on("packet", (packet) => {
    if (packet.type === 0) { // Connect
       handlers.onEvent({ kind: "log", message: `[Handshake] Packet received: ${JSON.stringify(packet.data)}` });
    }
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    handlers.onEvent({ kind: "log", message: `[Reconnection] Attempt ${attempt}...` });
  });

  socket.io.engine.on("upgrade", (transport) => {
    handlers.onEvent({ kind: "log", message: `[Engine] Upgraded to ${transport.name}.` });
  });

  socket.on("connect", () => {
    handlers.onStatus({
      status: "connected",
      socketId: socket.id ?? undefined,
      transport: socket.io.engine.transport.name as SocketTransport | undefined,
      connectedAt: Date.now(),
      lastError: undefined,
    });
    handlers.onEvent({
      kind: "connect",
      message: `[Success] Connected as ${socket.id}`,
    });
  });

  socket.on("disconnect", (reason) => {
    handlers.onStatus({
      status: "idle",
      socketId: undefined,
      transport: undefined,
      connectedAt: undefined,
      lastError: reason,
    });
    handlers.onEvent({
      kind: "disconnect",
      message: `[Session] Disconnected: ${reason}`,
    });
  });

  socket.on("connect_error", (error) => {
    handlers.onStatus({
      status: "error",
      lastError: error.message,
    });
    handlers.onEvent({
      kind: "error",
      message: error.message,
    });
  });

  socket.on("demo:welcome", (payload) => {
    handlers.onEvent({
      kind: "log",
      message: `Welcome payload received: ${JSON.stringify(payload)}`,
    });
  });

  socket.on("demo:heartbeat", (payload) => {
    const sentAt = typeof payload === "object" && payload !== null ? Number((payload as { sentAt?: number }).sentAt) : NaN;
    const pingMs = Number.isFinite(sentAt) ? Math.max(0, Date.now() - sentAt) : undefined;
    handlers.onStatus({ pingMs });
    handlers.onEvent({
      kind: "log",
      message: "Heartbeat received from demo server.",
    });
  });

  socket.onAny((eventName, ...args) => {
    if (eventName === "connect" || eventName === "disconnect" || eventName === "connect_error") return;
    handlers.onAnyEvent(eventName, args);
  });

  return socket;
}

export function disconnectSocket(tabId: string) {
  const socket = sockets.get(tabId);
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  sockets.delete(tabId);
}

export function isConnected(tabId: string) {
  return sockets.has(tabId);
}

export function emitEvent(
  tabId: string,
  eventName: string,
  payload: string,
  volatile: boolean,
  compress: boolean,
) {
  const socket = sockets.get(tabId);
  if (!socket || !eventName) return;

  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    data = payload;
  }

  let s = socket;
  if (volatile) s = s.volatile;
  if (compress) s = s.compress(true);

  s.emit(eventName, data);
}
