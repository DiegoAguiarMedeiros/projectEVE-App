import dayjs from 'dayjs';
import { Transactions } from 'src/types';
import { fDate, parseLocalDate } from 'src/utils/format';

export interface TransactionDateGroup {
  label: string;
  items: Transactions[];
}

export function groupTransactionsByDate(
  items: Transactions[],
  translate: (key: string) => string,
  referenceToday: dayjs.Dayjs = dayjs()
): [string, TransactionDateGroup][] {
  const groups = new Map<string, TransactionDateGroup>();
  const today = referenceToday.startOf('day');
  const yesterday = today.subtract(1, 'day').startOf('day');

  for (const tx of items) {
    const parsedTxDate = tx.date ? parseLocalDate(tx.date) : null;
    const key =
      parsedTxDate && parsedTxDate.isValid()
        ? parsedTxDate.format('YYYY-MM-DD')
        : 'no-date';
    if (!groups.has(key)) {
      const d = key !== 'no-date' ? parseLocalDate(key) : null;
      let label = key !== 'no-date' ? fDate(key) : '';
      if (d && d.isValid()) {
        if (d.isSame(today, 'day')) label = translate('common.today');
        else if (d.isSame(yesterday, 'day')) label = translate('common.yesterday');
      }
      groups.set(key, { label, items: [] });
    }
    groups.get(key)!.items.push(tx);
  }

  return Array.from(groups.entries());
}
