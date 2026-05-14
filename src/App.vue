<template>
  <div class="flex flex-col h-screen overflow-hidden bg-ss-bg-base text-ss-text-main">
    <AppHeader
      :brand="store.brand"
      :tabs="store.tabs"
      :active-tab-id="store.activeTabId"
      :dock="store.layoutDock"
      @new-tab="store.createTab"
      @save-tab="store.saveTab"
      @export-tab="store.saveActiveTabAsFile"
      @duplicate-tab="store.duplicateTab(store.activeTabId)"
      @select-tab="store.selectTab"
      @rename-tab="store.renameTab"
      @close-tab="store.closeTab"
      @toggle-dock="store.toggleDock"
      @connect-tab="store.connectActiveTab"
      @disconnect-tab="store.disconnectActiveTab"
    >
      <template #extra>
        <ThemeToggle />
      </template>
    </AppHeader>

    <main class="flex flex-1 overflow-hidden relative">
      <SidebarRail
        :sessions="store.sessions"
        :tabs="store.tabs"
        :active-tab-id="store.activeTabId"
        @open-session="store.openSession"
        @open-tab="store.selectTab"
        @new-session="store.createTab"
        @delete-session="store.deleteSession"
        @rename-session="store.renameSession"
        @duplicate-session="store.duplicateSession"
        @delete-multiple="store.deleteMultipleSessions"
        @reorder-sessions="store.reorderSessions"
      />

      <div class="flex-1 flex overflow-hidden relative" :class="{ 'flex-col': store.layoutDock === 'bottom' }">
        <ConnectionWorkbench
          v-if="store.activeTab"
          :tab="store.activeTab"
          @update-core="store.updateConnectionField"
          @toggle-mode="store.updateEditorMode($event.section, $event.mode)"
          @update-header="store.updateHeader"
          @toggle-header="store.toggleHeader"
          @update-query="store.updateQuery"
          @toggle-query-enabled="(id, enabled) => store.updateQuery(id, { enabled })"
          @remove-header="store.removeHeaderRow"
          @remove-query="store.removeQueryRow"
          @update-auth="store.updateAuth"
          @update-options="store.updateOptions"
          @update-scripts="store.updateScripts"
          @replace-json="store.replaceDraftFromJson"
          @replace-full-draft="store.replaceFullDraft"
          @update-listener="store.updateListener"
          @update-emitter="store.updateEmitter"
          @remove-emitter="store.removeEmitter"
          @remove-listener="store.removeListener"
          @emit-event="store.emitActiveTabEvent"
          @add-header="store.addHeaderRow"
          @add-query="store.addQueryRow"
          @add-listener="store.addListener"
          @add-emitter="store.addEmitter"
          @connect-tab="store.connectActiveTab"
          @disconnect-tab="store.disconnectActiveTab"
          @reset-tab="store.resetActiveTab"
          @save-tab="store.saveActiveTabAsFile"
        />

        <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center bg-ss-bg-base">
          <div class="max-w-md flex flex-col items-center gap-6">
            <img src="/images/empty-state.png" alt="Empty Workspace" class="w-72 h-72 object-contain opacity-80 drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
            <div class="space-y-2">
              <h2 class="text-2xl font-bold text-white">Ready to explore?</h2>
              <p class="text-ss-text-muted text-sm leading-relaxed">Select a saved request from the sidebar or create a new one to begin your socket session.</p>
            </div>
            <Button size="lg" class="bg-ss-accent-blue hover:bg-ss-accent-blue/90 text-white gap-2" @click="store.createTab">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create New Request
            </Button>
          </div>
        </div>

        <hr 
          class="bg-transparent hover:bg-ss-accent-blue/50 transition-colors z-10 border-none" 
          aria-label="Resize panels"
          :aria-orientation="store.layoutDock === 'right' ? 'vertical' : 'horizontal'"
          :class="store.layoutDock === 'right' ? 'w-1 cursor-col-resize h-full' : 'h-1 cursor-row-resize w-full'"
          @mousedown="startResize" 
        />

        <section class="bg-ss-bg-surface flex flex-col overflow-hidden" :style="railStyle" :class="{ 'border-l border-ss-border': store.layoutDock === 'right', 'border-t border-ss-border w-full': store.layoutDock === 'bottom' }">
          <LogConsole 
            :logs="store.activeTab?.logs || []" 
            :status="store.activeTab?.runtime.status"
            @clear="store.clearLogs" 
          />
        </section>
      </div>
    </main>

    <StatusBar :logs="store.activeTab?.logs || []" :session-count="store.sessions.length" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, defineAsyncComponent } from "vue";

import ThemeToggle from "@/components/common/ThemeToggle.vue";
import AppHeader from "@/components/layout/AppHeader.vue";
import SidebarRail from "@/components/layout/SidebarRail.vue";
import StatusBar from "@/components/layout/StatusBar.vue";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app.store";

const ConnectionWorkbench = defineAsyncComponent(() => import("@/components/connection/ConnectionWorkbench.vue"));
const LogConsole = defineAsyncComponent(() => import("@/components/metrics/LogConsole.vue"));

const store = useAppStore();
onMounted(() => {
  store.init();
});

const railStyle = computed(() => {
  const size = `${store.panelSize}px`;
  return store.layoutDock === "right" ? { width: size } : { height: size };
});

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    store.saveActiveTab();
  }
};

const startResize = (e: MouseEvent) => {
  const initialSize = store.panelSize;
  const initialPos = store.layoutDock === "right" ? e.clientX : e.clientY;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const currentPos = store.layoutDock === "right" ? moveEvent.clientX : moveEvent.clientY;
    const delta = initialPos - currentPos;
    const newSize = Math.max(200, Math.min(800, initialSize + delta));
    store.updatePanelSize(newSize);
  };

  const onMouseUp = () => {
    globalThis.removeEventListener("mousemove", onMouseMove);
    globalThis.removeEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "";
  };

  globalThis.addEventListener("mousemove", onMouseMove);
  globalThis.addEventListener("mouseup", onMouseUp);
  document.body.style.cursor = store.layoutDock === "right" ? "col-resize" : "row-resize";
};

onMounted(() => globalThis.addEventListener("keydown", handleKeydown));
onUnmounted(() => globalThis.removeEventListener("keydown", handleKeydown));
</script>
