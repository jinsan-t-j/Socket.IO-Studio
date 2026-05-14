<template>
  <aside class="w-64 flex flex-col bg-ss-bg-base border-r border-ss-border select-none relative" @mousedown="startDragSelect" @contextmenu.prevent>
    <section class="p-4 flex items-center justify-between border-b border-ss-border">
      <h2 class="text-xs font-bold text-ss-text-muted uppercase tracking-widest">Collections</h2>
      <div class="flex items-center gap-2">
        <Button 
          v-if="selectedIds.size > 0" 
          variant="destructive"
          size="xs"
          class="h-6 px-2 text-[10px] bg-ss-status-error"
          @click="confirmBulkDelete"
        >
          Delete ({{ selectedIds.size }})
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          class="h-6 w-6 text-ss-text-muted hover:text-ss-text-main"
          aria-label="Create new session"
          @click="$emit('new-session')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </Button>
      </div>
    </section>

    <section ref="scrollContainer" class="flex-1 overflow-y-auto no-scrollbar relative p-2">
      <div class="space-y-1">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="relative group rounded-md transition-colors"
          :class="[
            selectedIds.has(session.id) ? 'bg-ss-accent-blue/10' : '',
            dragSourceId === session.id ? 'opacity-50' : '',
            dropTargetId === session.id ? 'border-t-2 border-ss-accent-blue' : ''
          ]"
          :data-id="session.id"
          draggable="true"
          @dragstart="onDragStart(session.id, $event)"
          @dragover.prevent="onDragOver(session.id)"
          @drop="onDrop(session.id)"
          @dragend="onDragEnd"
        >
          <button
            type="button"
            class="w-full flex items-center gap-3 p-2 text-left rounded-md transition-all border border-transparent"
            :class="isSessionActive(session.id) ? 'bg-ss-bg-surface border-ss-border' : 'hover:bg-ss-bg-surface/50'"
            @click.stop="handleItemClick(session.id, $event)"
          >
            <span class="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" :style="{ backgroundColor: session.color }" />
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-medium text-ss-text-main truncate">{{ session.name }}</span>
              <span class="text-[10px] text-ss-text-muted truncate">{{ session.folder ?? "Workspace" }}</span>
            </div>
          </button>
          
          <div class="absolute right-2 top-1/2 -translate-y-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-6 w-6 text-ss-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Session options"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="bg-ss-bg-surface border-ss-border text-ss-text-main w-40">
                <DropdownMenuItem @click="startRename(session)">Rename</DropdownMenuItem>
                <DropdownMenuItem @click="copyUrl(session)">Copy URL</DropdownMenuItem>
                <DropdownMenuItem @click="duplicate(session.id)">Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator class="bg-ss-bg-base" />
                <DropdownMenuItem class="text-ss-status-error" @click="confirmDelete(session)">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <!-- Selection Box Overlay -->
      <div 
        v-if="isSelecting" 
        class="absolute bg-ss-accent-blue/20 border border-ss-accent-blue pointer-events-none z-50" 
        :style="selectionBoxStyle"
      />
    </section>

    <!-- Modals -->
    <BaseModal v-model="showDeleteModal" :title="bulkMode ? 'Delete Multiple' : 'Delete Request'">
      <div class="p-4 space-y-4">
        <p v-if="bulkMode" class="text-sm text-ss-text-muted">
          Are you sure you want to delete <strong class="text-ss-text-main">{{ selectedIds.size }}</strong> requests? This action cannot be undone.
        </p>
        <p v-else class="text-sm text-ss-text-muted">
          Are you sure you want to delete <strong class="text-ss-text-main">{{ targetSession?.name }}</strong>? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="ghost" class="text-ss-text-muted hover:text-ss-text-main" @click="showDeleteModal = false">Cancel</Button>
          <Button variant="destructive" class="bg-ss-status-error" @click="executeDelete">Delete</Button>
        </div>
      </div>
    </BaseModal>

    <BaseModal v-model="showRenameModal" title="Rename Request">
      <div class="p-4 space-y-4">
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-ss-text-muted uppercase tracking-wider">Name</label>
          <Input 
            ref="renameInput" 
            v-model="renameValue"
            class="bg-ss-bg-base border-ss-border text-ss-text-main"
            @keyup.enter="executeRename"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="ghost" class="text-ss-text-muted hover:text-ss-text-main" @click="showRenameModal = false">Cancel</Button>
          <Button variant="default" class="bg-ss-accent-blue text-white" @click="executeRename">Save</Button>
        </div>
      </div>
    </BaseModal>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";

import BaseModal from "@/components/common/BaseModal.vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { RequestTab, SavedSession } from "@/types/app";

const props = defineProps<{
  sessions: SavedSession[];
  tabs: RequestTab[];
  activeTabId: string;
}>();

const emit = defineEmits<{
  (event: "open-session", sessionId: string): void;
  (event: "delete-session", sessionId: string): void;
  (event: "delete-multiple", sessionIds: string[]): void;
  (event: "rename-session", sessionId: string, name: string): void;
  (event: "duplicate-session", sessionId: string): void;
  (event: "reorder-sessions", sessionIds: string[]): void;
  (event: "new-session"): void;
}>();

// Modals State
const showDeleteModal = ref(false);
const showRenameModal = ref(false);
const targetSession = ref<SavedSession | null>(null);
const renameValue = ref("");
const renameInput = ref<HTMLInputElement | null>(null);
const bulkMode = ref(false);

// Selection State
const selectedIds = ref<Set<string>>(new Set());
const isSelecting = ref(false);
const selectionStart = ref({ x: 0, y: 0 });
const selectionEnd = ref({ x: 0, y: 0 });
const scrollContainer = ref<HTMLElement | null>(null);

// Reordering State
const dragSourceId = ref<string | null>(null);
const dropTargetId = ref<string | null>(null);

const selectionBoxStyle = computed(() => {
  const left = Math.min(selectionStart.value.x, selectionEnd.value.x);
  const top = Math.min(selectionStart.value.y, selectionEnd.value.y);
  const width = Math.abs(selectionStart.value.x - selectionEnd.value.x);
  const height = Math.abs(selectionStart.value.y - selectionEnd.value.y);
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

function isSessionActive(sessionId: string) {
  const activeTab = props.tabs.find((t) => t.id === props.activeTabId);
  return activeTab?.sourceSessionId === sessionId;
}

// Menu Actions
function startRename(session: SavedSession) {
  targetSession.value = session;
  renameValue.value = session.name;
  showRenameModal.value = true;
  nextTick(() => renameInput.value?.focus());
}

function executeRename() {
  if (targetSession.value && renameValue.value.trim()) {
    emit('rename-session', targetSession.value.id, renameValue.value.trim());
    showRenameModal.value = false;
  }
}

function duplicate(sessionId: string) {
  emit('duplicate-session', sessionId);
}

function confirmDelete(session: SavedSession) {
  bulkMode.value = false;
  targetSession.value = session;
  showDeleteModal.value = true;
}

function confirmBulkDelete() {
  bulkMode.value = true;
  showDeleteModal.value = true;
}

function executeDelete() {
  if (bulkMode.value) {
    emit('delete-multiple', Array.from(selectedIds.value));
    selectedIds.value = new Set();
  } else if (targetSession.value) {
    emit('delete-session', targetSession.value.id);
  }
  showDeleteModal.value = false;
}

function copyUrl(session: SavedSession) {
  navigator.clipboard.writeText(session.draft.url);
}

// Drag Selection
function startDragSelect(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return;
  
  isSelecting.value = true;
  const rect = scrollContainer.value?.getBoundingClientRect();
  if (!rect) return;
  
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top + (scrollContainer.value?.scrollTop || 0);
  
  selectionStart.value = { x, y };
  selectionEnd.value = { x, y };
  
  if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
    selectedIds.value.clear();
  }

  window.addEventListener('mousemove', onDragSelectMove);
  window.addEventListener('mouseup', stopDragSelect);
}

function onDragSelectMove(e: MouseEvent) {
  if (!isSelecting.value || !scrollContainer.value) return;
  
  const rect = scrollContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top + scrollContainer.value.scrollTop;
  
  selectionEnd.value = { x, y };
  updateSelection();
}

function updateSelection() {
  if (!scrollContainer.value) return;
  
  const rect = scrollContainer.value.getBoundingClientRect();
  const boxTop = Math.min(selectionStart.value.y, selectionEnd.value.y);
  const boxBottom = Math.max(selectionStart.value.y, selectionEnd.value.y);
  const boxLeft = Math.min(selectionStart.value.x, selectionEnd.value.x);
  const boxRight = Math.max(selectionStart.value.x, selectionEnd.value.x);

  const next = new Set(selectedIds.value);
  const items = scrollContainer.value.querySelectorAll('[data-id]');
  items.forEach((item) => {
    const el = item as HTMLElement;
    const id = el.dataset.id!;
    const itemRect = el.getBoundingClientRect();
    const itemTop = itemRect.top - rect.top + scrollContainer.value!.scrollTop;
    const itemBottom = itemTop + itemRect.height;
    const itemLeft = itemRect.left - rect.left;
    const itemRight = itemLeft + itemRect.width;

    const isInside = (
      itemTop < boxBottom &&
      itemBottom > boxTop &&
      itemLeft < boxRight &&
      itemRight > boxLeft
    );

    if (isInside) {
      next.add(id);
    }
  });
  selectedIds.value = next;
}

function stopDragSelect() {
  isSelecting.value = false;
  window.removeEventListener('mousemove', onDragSelectMove);
  window.removeEventListener('mouseup', stopDragSelect);
}

function handleItemClick(id: string, e: MouseEvent) {
  if (e.metaKey || e.ctrlKey) {
    toggleSelect(id);
  } else {
    emit('open-session', id);
    if (!selectedIds.value.has(id)) {
      selectedIds.value = new Set();
    }
  }
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

// Reordering
function onDragStart(id: string, e: DragEvent) {
  dragSourceId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
}

function onDragOver(id: string) {
  if (dragSourceId.value !== id) {
    dropTargetId.value = id;
  }
}

function onDrop(targetId: string) {
  if (!dragSourceId.value || dragSourceId.value === targetId) return;
  
  const newOrder = [...props.sessions.map(s => s.id)];
  const fromIndex = newOrder.indexOf(dragSourceId.value);
  const toIndex = newOrder.indexOf(targetId);
  
  newOrder.splice(fromIndex, 1);
  newOrder.splice(toIndex, 0, dragSourceId.value);
  
  emit('reorder-sessions', newOrder);
}

function onDragEnd() {
  dragSourceId.value = null;
  dropTargetId.value = null;
}
</script>
