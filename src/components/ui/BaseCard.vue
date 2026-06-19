<script setup>
defineProps({
    elevated: { type: Boolean, default: true },
    interactive: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    padded: { type: Boolean, default: true },
    as: { type: String, default: 'div' },
});
</script>

<template>
    <component
        :is="as"
        :class="[
            'relative rounded-2xl transition-all duration-300',
            elevated ? 'bg-white/50 dark:bg-zinc-900/40 border border-border/30 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]' : '',
            interactive ? 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_15px_30px_-10px_rgba(139,92,246,0.15)] cursor-pointer' : '',
            premium ? 'bg-white/70 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/50 shadow-[0_25px_60px_-15px_rgba(139,92,246,0.18)]' : '',
            padded ? 'p-6' : '',
        ]"
    >
        <slot />
    </component>
</template>
