<template>
  <Button 
    variant="ghost" 
    size="icon" 
    class="h-8 w-8 text-ss-text-muted hover:text-ss-accent-blue hover:bg-ss-accent-blue/10 transition-all"
    :title="`Switch to ${nextTheme} mode`" 
    :aria-label="`Switch to ${nextTheme} mode`"
    @click="toggleTheme"
  >
    <svg v-if="currentTheme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  </Button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

import { Button } from "@/components/ui/button";

const currentTheme = ref("light");
const nextTheme = computed(() => (currentTheme.value === "light" ? "dark" : "light"));

function toggleTheme() {
  const newTheme = nextTheme.value;
  currentTheme.value = newTheme;
  
  if (newTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  
  localStorage.setItem("Socket.IO Studio.theme", newTheme);
}

onMounted(() => {
  const savedTheme = localStorage.getItem("Socket.IO Studio.theme") || "dark";
  currentTheme.value = savedTheme;
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});
</script>
