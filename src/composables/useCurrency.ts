export type CurrencyFormatter = (value: number | string | null | undefined) => string;

const vndFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

export function useCurrency(): CurrencyFormatter {
    return (value) => vndFormatter.format(Number(value) || 0);
}
