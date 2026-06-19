<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    size: { type: String, default: 'md' },
    closeOnBackdrop: { type: Boolean, default: true },
});

const emit = defineEmits(['close']);

const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
}[props.size];

function close() { emit('close'); }

function handleEsc(e) {
    if (e.key === 'Escape' && props.open) close();
}

onMounted(() => window.addEventListener('keydown', handleEsc));
onBeforeUnmount(() => window.removeEventListener('keydown', handleEsc));

watch(() => props.open, (val) => {
    if (typeof document !== 'undefined') document.body.style.overflow = val ? 'hidden' : '';
});
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="open"
                class="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                @click.self="closeOnBackdrop && close()"
            >
                <div :class="['relative w-full overflow-hidden rounded-2xl border border-border/40 bg-background shadow-2xl', sizeClass]" role="document">
                    <div v-if="title || $slots.header" class="flex items-center justify-between border-b border-border/40 px-6 py-4">
                        <h2 class="m-0 text-base font-extrabold text-foreground">
                            <slot name="header">{{ title }}</slot>
                        </h2>
                        <button
                            type="button"
                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Đóng"
                            @click="close"
                        >
                            <i class="h-4 w-4" aria-hidden="true">×</i>
                        </button>
                    </div>
                    <div class="max-h-[80vh] overflow-y-auto px-6 py-5">
                        <slot />
                    </div>
                    <div v-if="$slots.footer" class="flex items-center justify-end gap-2 border-t border-border/40 bg-secondary/40 px-6 py-3">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
