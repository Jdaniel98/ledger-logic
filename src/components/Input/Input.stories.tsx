import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { label: 'Account Name', placeholder: 'e.g. Monzo Current' },
};

export const WithError: Story = {
  args: { label: 'Account Name', value: '', error: 'Account name is required' },
};

export const WithValue: Story = {
  args: { label: 'Starting Balance', type: 'number', value: '1500.00' },
};

export const SmallSize: Story = {
  args: { label: 'Filter', placeholder: 'Search...', size: 'sm' },
};

export const NoLabel: Story = {
  args: { placeholder: 'Search accounts...' },
};
