import dayjs from 'dayjs';
import { Transactions } from 'src/types';
import { fDate } from 'src/utils/format';

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
    const key = tx.date ? dayjs(tx.date).format('YYYY-MM-DD') : 'no-date';
    if (!groups.has(key)) {
      const d = dayjs(key);
      let label = fDate(key);
      if (d.isValid()) {
        if (d.isSame(today, 'day')) label = translate('common.today');
        else if (d.isSame(yesterday, 'day')) label = translate('common.yesterday');
      }
      groups.set(key, { label, items: [] });
    }
    groups.get(key)!.items.push(tx);
  }

  return Array.from(groups.entries());
}
