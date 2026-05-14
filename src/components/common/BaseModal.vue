<template>
  <Teleport to="body">
    <Transition 
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="$emit('update:modelValue', false)">
        <div class="bg-ss-bg-base border border-ss-border rounded-lg shadow-2xl flex flex-col w-full overflow-hidden" :style="{ maxWidth: maxWidth || '400px' }">
          <header class="flex items-center justify-between px-4 py-3 border-b border-ss-border">
            <h3 class="text-sm font-bold text-white tracking-tight">{{ title }}</h3>
            <button 
              class="text-ss-text-muted hover:text-white transition-colors p-1" 
              @click="$emit('update:modelValue', false)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </header>
          
          <div class="p-0 flex-1 overflow-y-auto no-scrollbar">
            <slot />
          </div>
          
          <footer v-if="$slots.footer" class="px-4 py-3 border-t border-ss-border flex justify-end gap-3 bg-ss-bg-base/50">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title: string;
  maxWidth?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>
