import dayjs from 'dayjs';
import { groupTransactionsByDate } from '../groupTransactionsByDate';
import { Transactions } from 'src/types';

describe('groupTransactionsByDate (Feature Utility)', () => {
  const t = (key: string) => {
    if (key === 'common.today') return 'Hoje';
    if (key === 'common.yesterday') return 'Ontem';
    return key;
  };

  it('groups transactions by date and labels Today, Yesterday, and formatted dates', () => {
    const refToday = dayjs('2026-11-20');
    const items: Transactions[] = [
      {
        id: '1',
        envelopeId: 'env-1',
        description: 'Almoço',
        amount: '45.00',
        paymentMethod: 'envelope.transaction.payment_method.Pix',
        date: '2026-11-20',
        type: 'Debit',
        status: 'transaction.status.completed',
      },
      {
        id: '2',
        envelopeId: 'env-1',
        description: 'Café',
        amount: '15.00',
        paymentMethod: 'envelope.transaction.payment_method.Pix',
        date: '2026-11-20',
        type: 'Debit',
        status: 'transaction.status.pending',
      },
      {
        id: '3',
        envelopeId: 'env-1',
        description: 'Uber',
        amount: '30.00',
        paymentMethod: 'envelope.transaction.payment_method.CreditCard',
        date: '2026-11-19',
        type: 'Debit',
        status: 'transaction.status.completed',
      },
      {
        id: '4',
        envelopeId: 'env-1',
        description: 'Cinema',
        amount: '60.00',
        paymentMethod: 'envelope.transaction.payment_method.DebitCard',
        date: '2026-11-10',
        type: 'Debit',
        status: 'transaction.status.completed',
      },
    ];

    const groups = groupTransactionsByDate(items, t, refToday);
    expect(groups).toHaveLength(3);

    expect(groups[0][0]).toBe('2026-11-20');
    expect(groups[0][1].label).toBe('Hoje');
    expect(groups[0][1].items).toHaveLength(2);

    expect(groups[1][0]).toBe('2026-11-19');
    expect(groups[1][1].label).toBe('Ontem');
    expect(groups[1][1].items).toHaveLength(1);

    expect(groups[2][0]).toBe('2026-11-10');
    expect(groups[2][1].label).toBe('10/11/2026');
  });
});
