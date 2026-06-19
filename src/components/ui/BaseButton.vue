<script setup>
import { computed } from 'vue';

const props = defineProps({
    variant: { type: String, default: 'primary' },
    size: { type: String, default: 'md' },
    type: { type: String, default: 'button' },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    iconLeft: { type: String, default: '' },
    iconRight: { type: String, default: '' },
    ariaLabel: { type: String, default: '' },
});

defineEmits(['click']);

const baseClass = 'inline-flex items-center justify-center gap-2 rounded-2xl font-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

const variantClass = computed(() => {
    switch (props.variant) {
        case 'secondary':
            return 'bg-white/60 border border-border/60 text-foreground hover:bg-white hover:border-primary/30 shadow-sm';
        case 'danger':
            return 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm';
        case 'ghost':
            return 'bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/5';
        case 'primary':
        default:
            return 'bg-gradient-to-tr from-primary via-violet-600 to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5';
    }
});

const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'px-4 py-2 text-xs';
        case 'lg':
            return 'px-7 py-3.5 text-base';
        case 'md':
        default:
            return 'px-6 py-3 text-sm';
    }
});
</script>

<template>
    <button
        :type="type"
        :class="[baseClass, variantClass, sizeClass, block ? 'w-full' : '']"
        :disabled="disabled || loading"
        :aria-busy="loading || undefined"
        :aria-label="ariaLabel || undefined"
        @click="$emit('click', $event)"
    >
        <span v-if="loading" class="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
        <span v-else-if="iconLeft" class="flex h-4 w-4 items-center justify-center">
            <slot name="iconLeft">{{ iconLeft }}</slot>
        </span>
        <slot />
        <span v-if="iconRight && !loading" class="flex h-4 w-4 items-center justify-center">
            <slot name="iconRight">{{ iconRight }}</slot>
        </span>
    </button>
</template>
