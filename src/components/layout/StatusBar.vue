<template>
  <footer class="h-6 flex items-center justify-between px-3 bg-ss-bg-base border-t border-ss-border text-[10px] text-ss-text-muted select-none">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-ss-accent-blue animate-pulse text-[8px]">●</span>
        <span class="font-medium tracking-tight">Socket Studio Ready</span>
      </div>
    </div>
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>{{ logCount }} events</span>
      </div>
      <div class="flex items-center gap-2">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>{{ sessionCount }} requests</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { WorkspaceLogEntry } from "@/types/app";

const props = defineProps<{
  logs: WorkspaceLogEntry[];
  sessionCount: number;
}>();

const logCount = computed(() => props.logs.filter(l => l.kind === 'tab' && l.title.startsWith('EVENT')).length);
</script>
