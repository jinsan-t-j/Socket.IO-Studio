<template>
  <section class="flex flex-col flex-1 bg-ss-bg-base overflow-hidden">
    <header class="p-6 border-b border-ss-border flex flex-col gap-4">
      <div class="flex gap-2">
        <div class="flex items-center px-3 bg-ss-bg-surface text-ss-accent-blue font-bold text-xs rounded-l border border-ss-border">
          SOCKET
        </div>
        <Input 
          :model-value="tab.draft.url" 
          placeholder="Enter connection URL (e.g. http://localhost:3000)" 
          class="flex-1 bg-ss-bg-base border-ss-border text-ss-text-main focus-visible:ring-ss-accent-blue rounded-none"
          aria-label="Connection URL" 
          @update:model-value="(val: string | number) => updateCore('url', val)"
        />
        <Button 
          v-if="tab.runtime.status !== 'connected'"
          variant="default"
          class="bg-ss-accent-blue hover:bg-ss-accent-blue/90 text-white font-semibold px-6"
          @click="$emit('connect-tab')"
        >
          Connect
        </Button>
        <Button 
          v-else
          variant="destructive"
          class="bg-ss-status-error hover:bg-ss-status-error/90 text-white font-semibold px-6"
          @click="$emit('disconnect-tab')"
        >
          Disconnect
        </Button>
        
        <Button variant="outline" class="border-ss-border text-ss-text-muted gap-2" title="Reset to default configuration" aria-label="Reset request" @click="$emit('reset-tab', tab.id)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset
        </Button>
      </div>

      <div class="flex gap-6 pt-4 border-t border-ss-border">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-[10px] font-bold text-ss-text-muted uppercase tracking-wider whitespace-nowrap">
            Path
            <Input 
              :model-value="tab.draft.path" 
              placeholder="/socket.io" 
              class="h-8 w-32 bg-ss-bg-base border-ss-border text-ss-text-main text-xs"
              @update:model-value="(val: string | number) => updateCore('path', val)" 
            />
          </label>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-[10px] font-bold text-ss-text-muted uppercase tracking-wider whitespace-nowrap">
            Namespace
            <Input 
              :model-value="tab.draft.namespace" 
              placeholder="/" 
              class="h-8 w-20 bg-ss-bg-base border-ss-border text-ss-text-main text-xs"
              @update:model-value="(val: string | number) => updateCore('namespace', val)" 
            />
          </label>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-[10px] font-bold text-ss-text-muted uppercase tracking-wider whitespace-nowrap">
            Version
            <Select :model-value="String(tab.draft.version)" @update:model-value="(val: any) => updateCore('version', Number(val))">
              <SelectTrigger class="h-8 w-20 bg-ss-bg-base border-ss-border text-ss-text-main text-xs" aria-label="Socket.IO version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent class="bg-ss-bg-surface border-ss-border text-ss-text-main">
                <SelectItem value="2">v2</SelectItem>
                <SelectItem value="3">v3</SelectItem>
                <SelectItem value="4">v4</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </div>
    </header>

    <div class="flex border-b border-ss-border px-6 overflow-x-auto no-scrollbar" role="tablist" aria-label="Connection sections">
        <button
          v-for="section in sections"
          :id="`tab-${section.key}`"
          :key="section.key"
          type="button"
          role="tab"
          :aria-selected="activeSection === section.key"
          aria-controls="tabpanel-container"
          class="px-4 py-3 text-sm font-medium transition-colors border-b-2 relative -mb-[2px] whitespace-nowrap"
        :class="activeSection === section.key 
          ? 'text-ss-accent-blue border-ss-accent-blue' 
          : 'text-ss-text-muted border-transparent hover:text-ss-text-main hover:border-ss-border'"
        @click="activeSection = section.key"
      >
        {{ section.label }}
      </button>
    </div>

    <div 
      id="tabpanel-container"
      class="flex-1 overflow-y-auto p-6 space-y-6"
      role="tabpanel"
      :aria-labelledby="`tab-${activeSection}`"
    >
      <div class="space-y-1">
        <h3 class="text-base font-semibold text-ss-text-main">{{ activeSectionLabel }}</h3>
        <p class="text-xs text-ss-text-muted">{{ activeSectionDescription }}</p>
      </div>

      <div v-if="supportsMode" class="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          class="h-7 px-3 text-xs"
          :class="modeFor(modeSection) === 'form' ? 'bg-ss-accent-blue text-white border-ss-accent-blue' : 'border-ss-border text-ss-text-muted'"
          @click="setMode('form')"
        >
          Form
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          class="h-7 px-3 text-xs"
          :class="modeFor(modeSection) === 'json' ? 'bg-ss-accent-blue text-white border-ss-accent-blue' : 'border-ss-border text-ss-text-muted'"
          @click="setMode('json')"
        >
          JSON
        </Button>
      </div>

      <div class="space-y-4">
        <template v-if="activeSection === 'headers'">
          <div v-if="modeFor('headers') === 'form'" class="space-y-2">
            <div v-for="row in tab.draft.headers" :key="row.id" class="flex items-center gap-2 group">
              <Checkbox :checked="row.enabled" aria-label="Enable header" @update:checked="val => $emit('toggle-header', row.id, !!val, tab.id)" />
              <Input :model-value="row.key" placeholder="Key" class="flex-1 bg-ss-bg-base border-ss-border text-ss-text-main h-9" aria-label="Header key" @update:model-value="(val: string | number) => $emit('update-header', row.id, { key: String(val) }, tab.id)" />
              <Input :model-value="row.value" placeholder="Value" class="flex-1 bg-ss-bg-base border-ss-border text-ss-text-main h-9" aria-label="Header value" @update:model-value="(val: string | number) => $emit('update-header', row.id, { value: String(val) }, tab.id)" />
              <Button variant="ghost" size="icon" class="h-9 w-9 text-ss-text-muted hover:text-ss-status-error opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove header" @click="$emit('remove-header', row.id, tab.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </Button>
            </div>
            <Button variant="outline" size="sm" class="border-ss-border text-ss-text-muted" @click="$emit('add-header', tab.id)">+ Add row</Button>
          </div>
          <Textarea v-else class="min-h-[300px] font-mono text-xs bg-ss-bg-surface border-ss-border text-ss-text-main" :model-value="serialize(tab.draft.headers)" @change="$emit('replace-json', 'headers', ($event.target as HTMLTextAreaElement).value, tab.id)" />
        </template>

        <template v-else-if="activeSection === 'query'">
          <div v-if="modeFor('query') === 'form'" class="space-y-2">
            <div v-for="row in tab.draft.queryParams" :key="row.id" class="flex items-center gap-2 group">
              <Checkbox :checked="row.enabled" aria-label="Enable query parameter" @update:checked="val => $emit('toggle-query-enabled', row.id, !!val, tab.id)" />
              <Input :model-value="row.key" placeholder="Key" class="flex-1 bg-ss-bg-base border-ss-border text-ss-text-main h-9" aria-label="Query key" @update:model-value="(val: string | number) => $emit('update-query', row.id, { key: String(val) }, tab.id)" />
              <Input :model-value="row.value" placeholder="Value" class="flex-1 bg-ss-bg-base border-ss-border text-ss-text-main h-9" aria-label="Query value" @update:model-value="(val: string | number) => $emit('update-query', row.id, { value: String(val) }, tab.id)" />
              <Button variant="ghost" size="icon" class="h-9 w-9 text-ss-text-muted hover:text-ss-status-error opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove query parameter" @click="$emit('remove-query', row.id, tab.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </Button>
            </div>
            <Button variant="outline" size="sm" class="border-ss-border text-ss-text-muted" @click="$emit('add-query', tab.id)">+ Add row</Button>
          </div>
          <Textarea v-else class="min-h-[300px] font-mono text-xs bg-ss-bg-surface border-ss-border text-ss-text-main" :model-value="serialize(tab.draft.queryParams)" @change="$emit('replace-json', 'queryParams', ($event.target as HTMLTextAreaElement).value, tab.id)" />
        </template>

        <template v-else-if="activeSection === 'auth'">
          <div v-if="modeFor('auth') === 'form'" class="flex flex-col gap-6 max-w-2xl">
            <div class="space-y-2">
              <label for="auth-type" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Auth Type</label>
              <Select :model-value="tab.draft.auth.type" @update:model-value="(val: any) => $emit('update-auth', { type: String(val || 'none') }, tab.id)">
                <SelectTrigger class="w-full bg-ss-bg-base border-ss-border text-ss-text-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent class="bg-ss-bg-surface border-ss-border text-ss-text-main">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="api_key_header">API Key (Header)</SelectItem>
                  <SelectItem value="api_key_query">API Key (Query)</SelectItem>
                  <SelectItem value="handshake_auth">Handshake Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="tab.draft.auth.type === 'bearer'" class="space-y-2">
              <label for="token" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Token</label>
              <Input id="token" :model-value="tab.draft.auth.bearerToken" class="bg-ss-bg-base border-ss-border text-ss-text-main" @update:model-value="(val: string | number) => $emit('update-auth', { bearerToken: String(val) }, tab.id)" />
            </div>

            <div v-else-if="tab.draft.auth.type === 'basic'" class="flex gap-4">
              <div class="flex-1 space-y-2">
                <label for="username" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Username</label>
                <Input id="username" :model-value="tab.draft.auth.username" class="bg-ss-bg-base border-ss-border text-ss-text-main" @update:model-value="(val: string | number) => $emit('update-auth', { username: String(val) }, tab.id)" />
              </div>
              <div class="flex-1 space-y-2">
                <label for="password" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Password</label>
                <Input id="password" :model-value="tab.draft.auth.password" type="password" class="bg-ss-bg-base border-ss-border text-ss-text-main" @update:model-value="(val: string | number) => $emit('update-auth', { password: String(val) }, tab.id)" />
              </div>
            </div>

            <div v-else-if="tab.draft.auth.type === 'handshake_auth'" class="space-y-2">
              <label for="handshake-json" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Handshake JSON</label>
              <Textarea id="handshake-json" :model-value="tab.draft.auth.handshakeAuthJson" class="min-h-[120px] font-mono text-xs bg-ss-bg-surface border-ss-border text-ss-text-main" @update:model-value="(val: string | number) => $emit('update-auth', { handshakeAuthJson: String(val) }, tab.id)" />
            </div>
          </div>
          <Textarea v-else class="min-h-[300px] font-mono text-xs bg-ss-bg-surface border-ss-border text-ss-text-main" :model-value="serialize(tab.draft.auth)" @change="$emit('replace-json', 'auth', ($event.target as HTMLTextAreaElement).value, tab.id)" />
        </template>

        <template v-else-if="activeSection === 'options'">
          <div v-if="modeFor('options') === 'form'" class="flex flex-col gap-6 max-w-2xl">
            <div class="space-y-3">
              <label for="transports" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Transports</label>
              <div id="transports" class="flex gap-6">
                <div class="flex items-center gap-2">
                  <Checkbox id="transport-websocket" v-model:checked="wsTransport" />
                  <label for="transport-websocket" class="text-sm cursor-pointer">WebSocket</label>
                </div>
                <div class="flex items-center gap-2">
                  <Checkbox id="transport-polling" v-model:checked="pollingTransport" />
                  <label for="transport-polling" class="text-sm cursor-pointer">Polling</label>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-6 pt-4 border-t border-ss-border">
              <div class="flex items-center gap-2">
                <Checkbox id="opt-reconnection" v-model:checked="optReconnection" />
                <label for="opt-reconnection" class="text-sm cursor-pointer">Reconnection</label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox id="opt-upgrade" v-model:checked="optUpgrade" />
                <label for="opt-upgrade" class="text-sm cursor-pointer">Upgrade</label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox id="opt-multiplex" v-model:checked="optMultiplex" />
                <label for="opt-multiplex" class="text-sm cursor-pointer">Multiplex</label>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="space-y-2">
                <label for="attempts" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Attempts</label>
                <Input id="attempts" type="number" aria-label="Reconnection attempts" :model-value="tab.draft.options.reconnectionAttempts" class="bg-ss-bg-base border-ss-border text-ss-text-main h-9" @update:model-value="(val: string | number) => $emit('update-options', { reconnectionAttempts: Number(val) }, tab.id)" />
              </div>
              <div class="space-y-2">
                <label for="delay" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Delay (ms)</label>
                <Input id="delay" type="number" aria-label="Reconnection delay" :model-value="tab.draft.options.reconnectionDelay" class="bg-ss-bg-base border-ss-border text-ss-text-main h-9" @update:model-value="(val: string | number) => $emit('update-options', { reconnectionDelay: Number(val) }, tab.id)" />
              </div>
              <div class="space-y-2">
                <label for="timeout" class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Timeout (ms)</label>
                <Input id="timeout" type="number" aria-label="Connection timeout" :model-value="tab.draft.options.timeout" class="bg-ss-bg-base border-ss-border text-ss-text-main h-9" @update:model-value="(val: string | number) => $emit('update-options', { timeout: Number(val) }, tab.id)" />
              </div>
            </div>
          </div>
          <div v-else class="relative group/editor h-full">
            <Textarea 
              ref="optionsTextarea"
              aria-label="Socket.IO connection options JSON"
              class="min-h-[300px] h-full font-mono text-xs bg-ss-bg-surface border-ss-border text-ss-text-main" 
              :model-value="serialize(tab.draft.options)" 
              @change="$emit('replace-json', 'options', ($event.target as HTMLTextAreaElement).value, tab.id)" 
            />
              <Button 
                variant="ghost" 
                size="sm" 
                class="absolute bottom-2 right-4 h-7 px-2 text-[10px] bg-ss-bg-surface/80 hover:bg-ss-bg-surface border border-ss-border text-ss-text-muted opacity-0 group-hover/editor:opacity-100 transition-opacity"
                title="Beautify JSON"
                aria-label="Beautify options"
                @click="beautifyOptions"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mr-1.5" aria-hidden="true">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                Beautify
              </Button>
          </div>
        </template>

        <template v-else-if="activeSection === 'listeners'">
          <div class="space-y-3">
            <div v-for="listener in tab.draft.listeners" :key="listener.id" class="flex items-center gap-3 bg-ss-bg-surface/30 p-2 pl-3 rounded-md border border-ss-border group">
              <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" :style="{ backgroundColor: listener.color }" />
              <Input :model-value="listener.eventName" placeholder="Event Name" class="flex-1 bg-transparent border-none text-ss-text-main h-8 font-medium placeholder:font-normal" aria-label="Event name" @update:model-value="(val: string | number) => $emit('update-listener', listener.id, { eventName: String(val) }, tab.id)" />
              <Checkbox :checked="listener.enabled" aria-label="Enable listener" @update:checked="val => $emit('update-listener', listener.id, { enabled: !!val }, tab.id)" />
              <Button variant="ghost" size="icon" class="h-8 w-8 text-ss-text-muted hover:text-ss-status-error opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove listener" @click="$emit('remove-listener', listener.id, tab.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </Button>
            </div>
            <Button variant="outline" size="sm" class="border-ss-border text-ss-text-muted" @click="$emit('add-listener', tab.id)">+ Add Listener</Button>
          </div>
        </template>

        <template v-else-if="activeSection === 'events'">
          <div class="space-y-4">
            <div v-for="emitter in tab.draft.emitters" :key="emitter.id" class="bg-ss-bg-surface/30 rounded-lg border border-ss-border overflow-hidden">
              <div class="flex items-center gap-3 p-3 border-b border-ss-border bg-ss-bg-surface/50">
                <Input aria-label="Event name" :model-value="emitter.eventName" placeholder="Event Name" class="flex-1 bg-transparent border-none text-ss-text-main h-8 font-semibold" @update:model-value="(val: string | number) => $emit('update-emitter', emitter.id, { eventName: String(val) }, tab.id)" />
                <Button variant="default" size="sm" class="bg-ss-accent-blue hover:bg-ss-accent-blue/90 text-white h-8" @click="$emit('emit-event', emitter)">Emit</Button>
                <Button variant="ghost" size="icon" class="h-8 w-8 text-ss-text-muted hover:text-ss-status-error" aria-label="Remove emitter" @click="$emit('remove-emitter', emitter.id, tab.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </Button>
              </div>
              <div class="relative group/payload">
                <Textarea 
                  aria-label="Event payload JSON"
                  class="min-h-[120px] bg-transparent border-none font-mono text-[11px] rounded-none focus-visible:ring-0" 
                  :model-value="emitter.payload" 
                  placeholder="Payload JSON (Object or Array recommended)" 
                  @update:model-value="(val: string | number) => $emit('update-emitter', emitter.id, { payload: String(val) }, tab.id)" 
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="absolute bottom-2 right-2 h-6 px-2 text-[10px] bg-ss-bg-surface/50 hover:bg-ss-bg-surface border border-ss-border/50 text-ss-text-muted opacity-0 group-hover/payload:opacity-100 transition-opacity"
                  title="Beautify JSON Payload"
                  aria-label="Beautify emitter payload"
                  @click="beautifyEmitter(emitter.id, emitter.payload)"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mr-1.5" aria-hidden="true">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                  Beautify
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" class="border-ss-border text-ss-text-muted" @click="$emit('add-emitter', tab.id)">+ Add Emitter Preset</Button>
          </div>
        </template>

        <template v-else-if="activeSection === 'raw'">
          <div class="flex flex-col gap-4 h-full">
            <div class="flex justify-end gap-2">
              <Button variant="secondary" size="sm" class="bg-ss-bg-surface hover:bg-ss-bg-surface/80 text-white" aria-label="Beautify JSON" @click="beautifyRaw">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mr-2" aria-hidden="true">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                Beautify
              </Button>
              <Button variant="secondary" size="sm" class="bg-ss-bg-surface hover:bg-ss-bg-surface/80 text-white" :aria-label="isCopied ? 'Copied' : 'Copy JSON'" @click="copyRaw">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2" aria-hidden="true">
                  <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2Z"/>
                  <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/>
                </svg>
                {{ isCopied ? 'Copied!' : 'Copy JSON' }}
              </Button>
            </div>
            <Textarea
              ref="rawTextarea"
              class="flex-1 min-h-[400px] font-mono text-xs bg-ss-bg-surface border-ss-border text-ss-text-main"
              :model-value="serialize(tab.draft)"
              @change="$emit('replace-full-draft', ($event.target as HTMLTextAreaElement).value, tab.id)"
            />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RequestTab, SocketSessionDraft, SocketTransport } from "@/types/app";

const props = defineProps<{
  tab: RequestTab;
}>();

const emit = defineEmits<{
  (event: "toggle-mode", payload: { section: "headers" | "query" | "auth" | "options" | "scripts"; mode: "form" | "json"; tabId: string }): void;
  (event: "update-core", field: "url" | "path" | "namespace" | "version", value: string | number, tabId: string): void;
  (event: "update-header", id: string, patch: { key?: string; value?: string }, tabId: string): void;
  (event: "toggle-header", id: string, enabled: boolean, tabId: string): void;
  (event: "update-query", id: string, patch: { key?: string; value?: string }, tabId: string): void;
  (event: "toggle-query-enabled", id: string, enabled: boolean, tabId: string): void;
  (event: "remove-header", id: string, tabId: string): void;
  (event: "remove-query", id: string, tabId: string): void;
  (event: "update-auth", patch: Record<string, string | boolean>, tabId: string): void;
  (event: "update-options", patch: Record<string, string | number | boolean | string[]>, tabId: string): void;
  (event: "update-scripts", patch: Record<string, string>, tabId: string): void;
  (event: "replace-json", section: "headers" | "queryParams" | "auth" | "options" | "scripts", raw: string, tabId: string): void;
  (event: "replace-full-draft", raw: string, tabId: string): void;
  (event: "update-listener", id: string, patch: Record<string, string | boolean>, tabId: string): void;
  (event: "update-emitter", id: string, patch: Record<string, string | boolean>, tabId: string): void;
  (event: "remove-emitter", id: string, tabId: string): void;
  (event: "remove-listener", id: string, tabId: string): void;
  (event: "emit-event", emitter: { id: string; eventName: string; payload: string }): void;
  (event: "add-header", tabId: string): void;
  (event: "add-query", tabId: string): void;
  (event: "add-listener", tabId: string): void;
  (event: "add-emitter", tabId: string): void;
  (event: "toggle-transport", transport: SocketTransport, enabled: boolean, tabId: string): void;
  (event: "connect-tab"): void;
  (event: "disconnect-tab"): void;
  (event: "reset-tab", tabId: string): void;
  (event: "save-tab"): void;
}>();

const sections = [
  { key: "headers", label: "Headers", description: "Request headers for the connection." },
  { key: "query", label: "Query", description: "URL query parameters." },
  { key: "auth", label: "Auth", description: "Authentication configurations." },
  { key: "options", label: "Options", description: "Socket.IO client engine options." },
  { key: "listeners", label: "Listeners", description: "Incoming event rules." },
  { key: "events", label: "Events", description: "Outgoing event presets." },
  { key: "raw", label: "Raw", description: "Complete Socket.IO configuration in JSON." },
] as const;

const activeSection = ref<(typeof sections)[number]["key"]>("headers");
const modeSection = computed(() => activeSection.value as "headers" | "query" | "auth" | "options" | "scripts");

const optionsTextarea = ref<{ $el: HTMLElement } | null>(null);
const rawTextarea = ref<{ $el: HTMLElement } | null>(null);
const isCopied = ref(false);

const copyRaw = () => {
  navigator.clipboard.writeText(serialize(props.tab.draft));
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
};

function tryBeautify(raw: string): string | null {
  try {
    const obj = JSON.parse(raw);
    return JSON.stringify(obj, null, 2);
  } catch {
    return null;
  }
}

function beautifyEmitter(id: string, currentPayload: string) {
  const beautiful = tryBeautify(currentPayload);
  if (beautiful) {
    emit("update-emitter", id, { payload: beautiful }, props.tab.id);
  }
}

function beautifyOptions() {
  const el = optionsTextarea.value?.$el?.querySelector('textarea') || optionsTextarea.value?.$el as HTMLTextAreaElement;
  const currentVal = el?.value || serialize(props.tab.draft.options);
  const beautiful = tryBeautify(currentVal);
  if (beautiful) {
    emit("replace-json", "options", beautiful, props.tab.id);
  }
}

function beautifyRaw() {
  const el = rawTextarea.value?.$el?.querySelector('textarea') || rawTextarea.value?.$el as HTMLTextAreaElement;
  const currentVal = el?.value || serialize(props.tab.draft);
  const beautiful = tryBeautify(currentVal);
  if (beautiful) {
    emit("replace-full-draft", beautiful, props.tab.id);
  }
}

const activeSectionLabel = computed(() => sections.find((item) => item.key === activeSection.value)?.label ?? "");
const activeSectionDescription = computed(() => sections.find((item) => item.key === activeSection.value)?.description ?? "");
const supportsMode = computed(() => ["headers", "query", "auth", "options", "scripts"].includes(activeSection.value));

function modeFor(section: keyof SocketSessionDraft["editorModes"]) {
  return props.tab.draft.editorModes[section];
}

function setMode(mode: "form" | "json") {
  emit("toggle-mode", { section: modeSection.value, mode, tabId: props.tab.id });
}

function updateCore(field: "url" | "path" | "namespace" | "version", value: string | number) {
  emit("update-core", field, value, props.tab.id);
}

const wsTransport = computed({
  get: () => hasTransport('websocket'),
  set: (val) => toggleTransport('websocket', !!val)
})

const pollingTransport = computed({
  get: () => hasTransport('polling'),
  set: (val) => toggleTransport('polling', !!val)
})

const optReconnection = computed({
  get: () => props.tab.draft.options.reconnection,
  set: (val) => emit('update-options', { reconnection: !!val }, props.tab.id)
})

const optUpgrade = computed({
  get: () => props.tab.draft.options.upgrade,
  set: (val) => emit('update-options', { upgrade: !!val }, props.tab.id)
})

const optMultiplex = computed({
  get: () => props.tab.draft.options.multiplex,
  set: (val) => emit('update-options', { multiplex: !!val }, props.tab.id)
})

function hasTransport(transport: SocketTransport) {
  return props.tab.draft.options.transports.includes(transport);
}

function toggleTransport(transport: SocketTransport, enabled: boolean) {
  emit("toggle-transport", transport, enabled, props.tab.id);
}

function serialize(value: unknown) {
  return JSON.stringify(value, null, 2);
}
</script>
