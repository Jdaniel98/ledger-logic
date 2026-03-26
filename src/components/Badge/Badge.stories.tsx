import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    variant: { control: 'select', options: ['general', 'income', 'danger'] },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const General: Story = {
  args: { children: 'Groceries', variant: 'general' },
};

export const Income: Story = {
  args: { children: 'Salary', variant: 'income' },
};

export const Danger: Story = {
  args: { children: 'Over Budget', variant: 'danger' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Badge variant="general">Transport</Badge>
      <Badge variant="income">Freelance</Badge>
      <Badge variant="danger">Overspend</Badge>
    </div>
  ),
};
