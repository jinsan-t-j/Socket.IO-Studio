export type EditorMode = "form" | "json";

export type SocketVersion = 2 | 3 | 4;

export type SocketTransport = "websocket" | "polling";

export type DockPosition = "right" | "bottom";

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: "none" | "bearer" | "basic" | "api_key_header" | "api_key_query" | "handshake_auth";
  bearerToken: string;
  username: string;
  password: string;
  apiKeyName: string;
  apiKeyValue: string;
  handshakeAuthJson: string;
}

export interface SocketOptionsConfig {
  transports: SocketTransport[];
  upgrade: boolean;
  rememberUpgrade: boolean;
  forceNew: boolean;
  multiplex: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  randomizationFactor: number;
  timeout: number;
  withCredentials: boolean;
  autoUnref: boolean;
  timestampRequests: boolean;
  timestampParam: string;
  perMessageDeflate: boolean;
  parser: "default" | "msgpack";
}

export interface ScriptConfig {
  preConnect: string;
  postEvent: string;
}

export interface EmitPreset {
  id: string;
  eventName: string;
  payload: string;
  volatile: boolean;
  compress: boolean;
}

export interface ListenerRule {
  id: string;
  eventName: string;
  enabled: boolean;
  color: string;
}

export interface SocketSessionDraft {
  url: string;
  path: string;
  namespace: string;
  version: SocketVersion;
  headers: KeyValueRow[];
  queryParams: KeyValueRow[];
  auth: AuthConfig;
  options: SocketOptionsConfig;
  scripts: ScriptConfig;
  emitters: EmitPreset[];
  listeners: ListenerRule[];
  editorModes: Record<"headers" | "query" | "auth" | "options" | "scripts", EditorMode>;
}

export interface ConnectionRuntime {
  status: "idle" | "connecting" | "connected" | "error";
  socketId?: string;
  transport?: SocketTransport;
  connectedAt?: number;
  pingMs?: number;
  lastError?: string;
}

export interface SavedSession {
  id: string;
  name: string;
  color: string;
  folder?: string;
  draft: SocketSessionDraft;
  createdAt: number;
  updatedAt: number;
}

export interface RequestTab {
  id: string;
  name: string;
  sourceSessionId?: string;
  draft: SocketSessionDraft;
  dirty: boolean;
  createdAt: number;
  runtime: ConnectionRuntime;
  logs: WorkspaceLogEntry[];
}

export interface WorkspaceLogEntry {
  id: string;
  timestamp: string;
  kind: "session" | "tab" | "edit" | "save" | "emit" | "listener" | "error";
  title: string;
  detail: string;
}
