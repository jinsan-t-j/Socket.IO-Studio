<template>
  <div class="p-6 space-y-6">
    <div class="space-y-1">
      <h3 class="text-sm font-bold text-ss-text-main uppercase tracking-wider">Connection</h3>
      <p class="text-xs text-ss-text-muted">Real-time socket metrics and identifiers</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-ss-bg-surface/30 border border-ss-border p-4 rounded-lg space-y-2">
        <h4 class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Status</h4>
        <div 
          class="text-sm font-bold capitalize"
          :class="{
            'text-ss-status-success': tab?.runtime.status === 'connected',
            'text-ss-status-warning': tab?.runtime.status === 'connecting',
            'text-ss-status-error': tab?.runtime.status === 'error'
          }"
        >
          {{ tab?.runtime.status || 'inactive' }}
        </div>
      </div>

      <div v-if="tab?.runtime.socketId" class="bg-ss-bg-surface/30 border border-ss-border p-4 rounded-lg space-y-2">
        <h4 class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Socket ID</h4>
        <div class="text-xs font-mono text-ss-text-main break-all">{{ tab.runtime.socketId }}</div>
      </div>

      <div v-if="tab?.runtime.transport" class="bg-ss-bg-surface/30 border border-ss-border p-4 rounded-lg space-y-2">
        <h4 class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Transport</h4>
        <div class="text-sm font-semibold text-ss-text-main capitalize">{{ tab.runtime.transport }}</div>
      </div>

      <div v-if="tab?.runtime.pingMs" class="bg-ss-bg-surface/30 border border-ss-border p-4 rounded-lg space-y-2">
        <h4 class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Latency</h4>
        <div class="text-sm font-semibold text-ss-text-main">{{ tab.runtime.pingMs }} ms</div>
      </div>
    </div>

    <div v-if="tab?.runtime.lastError" class="bg-ss-status-error/5 border border-ss-status-error/20 p-4 rounded-lg space-y-2 border-l-4 border-l-ss-status-error">
      <h4 class="text-[10px] font-bold text-ss-status-error uppercase tracking-wider">Last Error</h4>
      <div class="text-xs text-ss-text-main leading-relaxed">{{ tab.runtime.lastError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RequestTab, SavedSession } from "@/types/app";

defineProps<{
  session?: SavedSession;
  tab?: RequestTab;
}>();
</script>
