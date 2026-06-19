<script setup>
defineProps({
    modelValue: { type: [String, Number], default: null },
    options: { type: Array, default: () => [] },
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Chọn…' },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    id: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

function onChange(ev) {
    const value = ev.target.value;
    emit('update:modelValue', value === '' ? null : value);
}
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <label v-if="label" :for="id" class="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {{ label }}<span v-if="required" class="ml-1 text-destructive">*</span>
        </label>
        <div class="relative">
            <select
                :id="id"
                :value="modelValue ?? ''"
                :required="required"
                :disabled="disabled"
                class="w-full appearance-none rounded-2xl border border-border/60 bg-background/60 px-4 py-2.5 pr-10 text-sm font-medium text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                @change="onChange"
            >
                <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
                <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
        </div>
    </div>
</template>

<style scoped>
select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1rem;
}
</style>
