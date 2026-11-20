import dayjs from 'dayjs';
import { currencies, usePreferencesStore } from 'src/store/usePreferencesStore';

export type InputNumberValue = string | number | null | undefined;

function processInput(inputValue: InputNumberValue): number | null {
  if (inputValue == null || inputValue === '' || Number.isNaN(Number(inputValue))) return null;
  return Number(inputValue);
}

export function getCurrencyConfig() {
  const { currencyCode } = usePreferencesStore.getState();
  return currencies.find((c) => c.code === currencyCode) || currencies[0];
}

export function getNumberFormatLocale(): string {
  const { numberFormat } = usePreferencesStore.getState();
  return numberFormat === 'dot-comma' ? 'pt-BR' : 'en-US';
}

export function fNumber(inputValue: InputNumberValue, options?: Intl.NumberFormatOptions): string {
  const number = processInput(inputValue);
  if (number === null) return '';

  const style = usePreferencesStore.getState().numberFormat;
  const fixed = number.toFixed(options?.minimumFractionDigits ?? 2);
  const [intPart, decPart] = fixed.split('.');

  if (style === 'dot-comma') {
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decPart ? `${formattedInt},${decPart}` : formattedInt;
  } else {
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  }
}

export function fCurrency(inputValue: InputNumberValue): string {
  const number = processInput(inputValue);
  if (number === null) return '';
  const { symbol } = getCurrencyConfig();
  return `${symbol} ${fNumber(number, { minimumFractionDigits: 2 })}`;
}

export function fNumberToCurrency(inputValue: InputNumberValue): string {
  return fCurrency(inputValue);
}

export function fShortenNumber(inputValue: InputNumberValue): string {
  const number = processInput(inputValue);
  if (number === null) return '';
  const abs = Math.abs(number);
  if (abs >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}m`;
  }
  if (abs >= 1_000) {
    return `${(number / 1_000).toFixed(1)}k`;
  }
  return number.toFixed(0);
}

export function fDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const { dateFormat } = usePreferencesStore.getState();
  const d = dayjs(date);
  if (!d.isValid()) return String(date);
  return d.format(dateFormat);
}

export function getContrastColor(hexColor: string): string {
  if (!hexColor || hexColor.length < 7) return '#FFFFFF';
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#1F2937' : '#FFFFFF';
}

export function hexWithAlpha(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(24, 119, 242, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getGoalDeadlineCount(deadline: number | string): number {
  const parsedDeadline = Number(deadline);
  return Number.isNaN(parsedDeadline) ? 0 : parsedDeadline;
}

export function getGoalDeadlineInMonths(deadline: number | string, monthYear: boolean): number {
  const count = getGoalDeadlineCount(deadline);
  return monthYear ? count : count * 12;
}

export function formatGoalDeadline(
  t: (key: string, options?: Record<string, unknown>) => string,
  deadline: number | string,
  monthYear: boolean
): string {
  const count = getGoalDeadlineCount(deadline);
  if (monthYear) {
    const unit = t(count === 1 ? 'settings.goals.time.month' : 'settings.goals.time.months');
    return `${count} ${unit.toLowerCase()}`;
  }
  const unit = t(count === 1 ? 'settings.goals.time.year' : 'settings.goals.time.years');
  return `${count} ${unit.toLowerCase()}`;
}

export function getEffectivePaidInstallments(
  realPaidInstallments: number,
  totalInstallments: number,
  selectedMonth: number,
  selectedYear: number
): number {
  const now = new Date();
  const offsetFromNow =
    (selectedYear - now.getFullYear()) * 12 + (selectedMonth - 1 - now.getMonth());

  if (offsetFromNow > 0) {
    return Math.min(totalInstallments, realPaidInstallments + offsetFromNow);
  }

  const selectedIndex = realPaidInstallments + offsetFromNow;
  if (selectedIndex < 0) return 0;
  const clampedIndex = Math.min(selectedIndex, totalInstallments);
  return Math.min(realPaidInstallments, clampedIndex);
}

export function getInstallmentDate(
  index: number,
  realPaidInstallments: number,
  paymentDay: number
): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - realPaidInstallments + index, paymentDay);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}
