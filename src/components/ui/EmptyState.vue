<script setup>
defineProps({
    title: { type: String, default: 'Chưa có dữ liệu' },
    description: { type: String, default: '' },
    icon: { type: String, default: 'inbox' },
    actionLabel: { type: String, default: '' },
});

defineEmits(['action']);
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/40 bg-background/40 p-10 text-center text-muted-foreground">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <i class="h-5 w-5" :class="icon" aria-hidden="true" />
        </div>
        <h3 class="m-0 text-base font-extrabold text-foreground">{{ title }}</h3>
        <p v-if="description" class="m-0 max-w-sm text-sm font-medium text-muted-foreground">{{ description }}</p>
        <button
            v-if="actionLabel"
            class="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-extrabold text-primary transition hover:bg-primary/20"
            type="button"
            @click="$emit('action')"
        >
            {{ actionLabel }}
        </button>
    </div>
</template>
