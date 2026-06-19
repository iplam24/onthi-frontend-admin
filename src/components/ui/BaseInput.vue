<script setup>
defineProps({
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    error: { type: String, default: '' },
    hint: { type: String, default: '' },
    icon: { type: String, default: '' },
    autocomplete: { type: String, default: '' },
    id: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

function onInput(ev) {
    emit('update:modelValue', ev.target.value);
}
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <label v-if="label" :for="id" class="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {{ label }}<span v-if="required" class="ml-1 text-destructive">*</span>
        </label>
        <div
            :class="[
                'group flex items-center gap-2 rounded-2xl border bg-background/60 px-4 py-2.5 transition-all',
                error ? 'border-destructive/40 focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20' : 'border-border/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                disabled ? 'opacity-60' : '',
            ]"
        >
            <i v-if="icon" class="h-4 w-4 text-muted-foreground" :class="icon" aria-hidden="true" />
            <input
                :id="id"
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :required="required"
                :disabled="disabled"
                :autocomplete="autocomplete || undefined"
                class="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                @input="onInput"
            />
        </div>
        <p v-if="error" class="text-xs font-medium text-destructive">{{ error }}</p>
        <p v-else-if="hint" class="text-xs font-medium text-muted-foreground">{{ hint }}</p>
    </div>
</template>
