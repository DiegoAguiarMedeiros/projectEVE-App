import { usePreferencesStore } from 'src/store/usePreferencesStore';
import {
  fCurrency,
  fDate,
  getContrastColor,
  getEffectivePaidInstallments,
  getGoalDeadlineInMonths,
} from '../format';

describe('format utilities', () => {
  it('formats dates respecting user dateFormat preference (DD/MM/YYYY vs MM/DD/YYYY)', () => {
    usePreferencesStore.setState({ dateFormat: 'DD/MM/YYYY' });
    expect(fDate('2026-11-20')).toBe('20/11/2026');

    usePreferencesStore.setState({ dateFormat: 'MM/DD/YYYY' });
    expect(fDate('2026-11-20')).toBe('11/20/2026');

    usePreferencesStore.setState({ dateFormat: 'DD/MM/YYYY' });
  });

  it('formats currency according to active preference', () => {
    usePreferencesStore.setState({
      currencyCode: 'BRL',
      numberFormat: 'dot-comma',
    });
    expect(fCurrency(1500.5)).toContain('1.500,50');
  });

  it('computes goal deadline in months and effective paid installments', () => {
    expect(getGoalDeadlineInMonths(18, true)).toBe(18);
    expect(getGoalDeadlineInMonths(2, false)).toBe(24);

    const now = new Date();
    expect(
      getEffectivePaidInstallments(3, 10, now.getMonth() + 1, now.getFullYear())
    ).toBe(3);
  });

  it('returns readable contrast color for light and dark backgrounds', () => {
    expect(getContrastColor('#FFFFFF')).toBe('#1F2937');
    expect(getContrastColor('#000000')).toBe('#FFFFFF');
  });
});
