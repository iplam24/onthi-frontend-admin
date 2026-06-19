<script setup>
defineProps({
    lines: { type: Number, default: 3 },
    height: { type: String, default: 'h-4' },
    widthClass: { type: String, default: 'w-2/3' },
    rounded: { type: String, default: 'rounded-xl' },
});
</script>

<template>
    <div class="flex flex-col gap-2" aria-hidden="true">
        <div
            v-for="n in lines"
            :key="n"
            :class="['animate-pulse bg-secondary/60', height, widthClass, rounded]"
        />
    </div>
</template>
