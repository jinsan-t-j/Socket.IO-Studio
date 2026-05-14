<template>
  <section class="panel activity-panel">
    <header class="panel__header">
      <div>
        <h3>Activity</h3>
        <p>Session and editor actions</p>
      </div>
    </header>

    <div class="activity-scroll">
      <article v-for="entry in logs" :key="entry.id" class="activity-entry" :data-kind="entry.kind">
        <div class="activity-entry__meta">
          <span class="activity-entry__time">{{ entry.timestamp }}</span>
          <span class="activity-entry__kind">{{ entry.kind }}</span>
        </div>
        <strong>{{ entry.title }}</strong>
        <p>{{ entry.detail }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WorkspaceLogEntry } from "@/types/app";

defineProps<{
  logs: WorkspaceLogEntry[];
}>();
</script>
