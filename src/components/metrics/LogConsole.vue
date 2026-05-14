<template>
  <div class="flex flex-col h-full bg-ss-bg-base border-t border-ss-border overflow-hidden">
    <!-- Console Header -->
    <header class="flex items-center justify-between px-4 py-3 bg-ss-bg-base/50 backdrop-blur-sm border-b border-ss-border">
      <div class="flex items-center gap-3">
        <h3 class="text-[10px] font-bold text-ss-text-muted uppercase tracking-widest">Console</h3>
        <Badge 
          v-if="status" 
          variant="outline" 
          class="h-5 px-2 text-[9px] font-bold uppercase border-ss-border"
          :class="{
            'text-ss-status-success border-ss-status-success/30 bg-ss-status-success/5': status === 'connected',
            'text-ss-status-warning border-ss-status-warning/30 bg-ss-status-warning/5': status === 'connecting',
            'text-ss-status-error border-ss-status-error/30 bg-ss-status-error/5': status === 'error'
          }"
        >
          {{ status }}
        </Badge>
      </div>
      
      <div class="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          class="h-7 w-7 text-ss-text-muted hover:text-ss-status-error hover:bg-ss-status-error/10 transition-colors"
          title="Clear console"
          @click="$emit('clear')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
          </svg>
        </Button>
      </div>
    </header>

    <!-- Log List -->
    <div class="flex-1 overflow-y-auto no-scrollbar font-mono">
      <div v-if="logs.length === 0" class="flex flex-col items-center justify-center h-full text-ss-text-muted opacity-40 py-12">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-4">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
        </svg>
        <span class="text-xs uppercase tracking-widest">No logs to display</span>
      </div>

      <div 
        v-for="log in logs" 
        :key="log.id" 
        class="border-b border-ss-border/30 group last:border-0"
      >
        <div 
          class="flex items-center gap-4 px-4 py-2 cursor-pointer hover:bg-ss-bg-surface/30 transition-colors"
          @click="toggleExpand(log.id)"
        >
          <div class="flex items-center gap-3 min-w-[200px]">
            <span 
              class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-ss-bg-surface text-ss-text-muted min-w-[60px] text-center"
              :class="{ 'bg-ss-status-error/10 text-ss-status-error': log.kind === 'error' }"
            >
              {{ log.kind }}
            </span>
            <span class="text-[10px] text-ss-text-muted opacity-60 tabular-nums">{{ log.timestamp }}</span>
          </div>
          
          <span class="flex-1 text-xs text-ss-text-main truncate group-hover:text-white transition-colors">
            {{ log.title }}
          </span>
          
          <svg 
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            class="text-ss-text-muted transition-transform duration-200"
            :class="{ 'rotate-90': expandedId === log.id }"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <!-- Detail Panel -->
        <div 
          v-if="expandedId === log.id" 
          class="bg-ss-bg-base/80 border-t border-ss-border/20"
        >
          <div class="p-4 ml-[76px] relative">
            <!-- Line numbers decoration -->
            <div class="absolute left-0 top-4 w-px h-[calc(100%-32px)] bg-ss-accent-blue/20"/>
            <pre class="text-[11px] text-ss-text-main/80 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all select-text">{{ log.detail }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkspaceLogEntry } from "@/types/app";

defineProps<{
  logs: WorkspaceLogEntry[];
  status?: string;
}>();

defineEmits<{
  (e: 'clear'): void;
}>();

const expandedId = ref<string | null>(null);

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}
</script>
