<script setup lang="ts">
import { Check } from "lucide-vue-next"
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from "reka-ui"
import { computed } from "vue"

import { cn } from '@/utils'

import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui"

const props = defineProps<CheckboxRootProps & { class?: string }>()
const emits = defineEmits<CheckboxRootEmits>()

const checked = defineModel<boolean | 'indeterminate'>('checked')

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    v-model="checked"
    :class="
      cn('grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-ss-border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-ss-accent-blue data-[state=checked]:text-white',
         props.class)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <slot>
        <Check class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
