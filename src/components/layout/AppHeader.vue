<template>
  <header class="flex h-12 shrink-0 items-center justify-between border-b border-ss-border bg-ss-bg-base px-3">
    <div class="flex items-center gap-2">
      <span class="text-xl text-ss-accent-blue">⚡</span>
      <div class="text-sm font-semibold text-ss-text-main">{{ brand }}</div>
    </div>

    <div class="flex flex-1 items-center h-full px-4 overflow-x-auto no-scrollbar" role="tablist">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="group flex items-center gap-2 px-3 h-full cursor-pointer border-r border-ss-border hover:bg-ss-bg-surface transition-colors relative min-w-[120px] max-w-[200px]"
        :class="{ 'bg-ss-bg-surface': tab.id === activeTabId }"
        @click="$emit('select-tab', tab.id)"
        @dblclick="startRename(tab)"
      >
        <span
class="w-2 h-2 rounded-full shrink-0" :class="[
          tab.runtime.status === 'connected' ? 'bg-ss-status-success' : 
          tab.runtime.status === 'connecting' ? 'bg-ss-status-warning animate-pulse' : 
          'bg-ss-text-muted'
        ]" />
        
        <input
          v-if="renamingTabId === tab.id"
          v-model="renameValue"
          class="bg-transparent border-b border-ss-accent-blue outline-none text-sm w-full text-ss-text-main"
          type="text"
          autoFocus
          aria-label="Rename request tab"
          @blur="commitRename(tab.id)"
          @keydown.enter.prevent="commitRename(tab.id)"
          @keydown.esc.prevent="cancelRename"
        />
        <span v-else class="text-sm text-ss-text-muted group-hover:text-ss-text-main truncate transition-colors" :class="{ 'text-ss-text-main': tab.id === activeTabId }">
          {{ tab.name }}
        </span>

        <div class="ml-auto flex items-center gap-2 h-full">
          <button
            v-if="tab.dirty"
            type="button"
            class="w-2 h-2 rounded-full bg-ss-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.5)] hover:scale-125 hover:shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-all shrink-0"
            aria-label="Save changes"
            @click.stop="$emit('save-tab', tab.id)"
          />
          
          <button
            type="button"
            class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all shrink-0"
            aria-label="Close tab"
            @click.stop="$emit('close-tab', tab.id)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div v-if="tab.id === activeTabId" class="absolute bottom-0 left-0 right-0 h-0.5 bg-ss-accent-blue" />
      </div>

      <Button variant="ghost" size="icon" class="h-8 w-8 ml-2 text-ss-text-muted hover:text-ss-text-main" aria-label="Create new request" @click="$emit('new-tab')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <slot name="extra" />
      <Button variant="ghost" size="icon" class="h-8 w-8 text-ss-text-muted hover:text-ss-text-main" :title="`Dock ${dockLabel}`" @click="$emit('toggle-dock')">
        <svg v-if="dock === 'right'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M15 3v18"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 15h18"/>
        </svg>
      </Button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { Button } from "@/components/ui/button";
import type { DockPosition, RequestTab } from "@/types/app";

const props = defineProps<{
  brand: string;
  tabs: RequestTab[];
  activeTabId: string;
  dock: DockPosition;
}>();

const emit = defineEmits<{
  (event: "select-tab", tabId: string): void;
  (event: "new-tab"): void;
  (event: "save-tab", tabId: string): void;
  (event: "export-tab"): void;
  (event: "toggle-dock"): void;
  (event: "connect-tab"): void;
  (event: "disconnect-tab"): void;
  (event: "rename-tab", tabId: string, name: string): void;
  (event: "close-tab", tabId: string): void;
}>();

const renamingTabId = ref("");
const renameValue = ref("");

const dockLabel = computed(() => (props.dock === "right" ? "Bottom" : "Right"));

function startRename(tab: RequestTab) {
  renamingTabId.value = tab.id;
  renameValue.value = tab.name;
}

function commitRename(tabId: string) {
  if (!renameValue.value.trim()) {
    cancelRename();
    return;
  }
  emit("rename-tab", tabId, renameValue.value.trim());
  cancelRename();
}

function cancelRename() {
  renamingTabId.value = "";
  renameValue.value = "";
}
</script>
