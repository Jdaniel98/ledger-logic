import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataRow } from './DataRow';
import { Badge } from '../Badge/Badge';
import { Bank, CreditCard, PiggyBank } from '@phosphor-icons/react';

const meta: Meta<typeof DataRow> = {
  title: 'Components/DataRow',
  component: DataRow,
};

export default meta;
type Story = StoryObj<typeof DataRow>;

export const Default: Story = {
  args: { label: 'Monzo Current', value: '£2,450.00' },
};

export const WithIcon: Story = {
  args: {
    label: 'Monzo Current',
    sublabel: 'Current Account',
    value: '£2,450.00',
    icon: <Bank size={20} weight="duotone" />,
  },
};

export const WithBadge: Story = {
  args: {
    label: 'Monthly Budget',
    value: '£1,200.00',
    rightSlot: <Badge variant="income">On Track</Badge>,
  },
};

export const Clickable: Story = {
  args: {
    label: 'Savings Account',
    sublabel: 'Marcus by Goldman Sachs',
    value: '£8,500.00',
    icon: <PiggyBank size={20} weight="duotone" />,
    onClick: () => alert('Clicked!'),
  },
};

export const AccountList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
      <DataRow label="Monzo Current" sublabel="Current Account" value="£2,450.00" icon={<Bank size={20} weight="duotone" />} />
      <DataRow label="Amex Gold" sublabel="Credit Card" value="-£340.20" icon={<CreditCard size={20} weight="duotone" />} />
      <DataRow label="Marcus Savings" sublabel="Savings" value="£8,500.00" icon={<PiggyBank size={20} weight="duotone" />} />
    </div>
  ),
};
