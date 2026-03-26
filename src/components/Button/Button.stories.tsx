import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Plus, Trash } from '@phosphor-icons/react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Add Account' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'View Details' },
};

export const WithIcon: Story = {
  args: { variant: 'primary', children: 'New Transaction', icon: <Plus weight="bold" /> },
};

export const Loading: Story = {
  args: { variant: 'primary', children: 'Saving...', loading: true },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: 'Submit', disabled: true },
};

export const SmallSize: Story = {
  args: { variant: 'secondary', size: 'sm', children: 'Edit' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="secondary" icon={<Trash />}>Delete</Button>
    </div>
  ),
};
