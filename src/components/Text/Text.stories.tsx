import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'base', 'md', 'lg'] },
    weight: { control: 'select', options: ['regular', 'medium', 'semibold', 'bold'] },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'brand', 'nav', 'on-accent', 'danger', 'income', 'badge', 'badge-income', 'placeholder', 'disabled'],
    },
    as: { control: 'select', options: ['p', 'span', 'label', 'div'] },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: { children: 'The quick brown fox jumps over the lazy dog.' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text size="xs">Extra small (10px)</Text>
      <Text size="sm">Small (12px)</Text>
      <Text size="base">Base (14px)</Text>
      <Text size="md">Medium (16px)</Text>
      <Text size="lg">Large (18px)</Text>
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text weight="regular">Regular 400</Text>
      <Text weight="medium">Medium 500</Text>
      <Text weight="semibold">SemiBold 600</Text>
      <Text weight="bold">Bold 700</Text>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Text color="primary">Primary</Text>
      <Text color="secondary">Secondary</Text>
      <Text color="brand">Brand</Text>
      <Text color="danger">Danger</Text>
      <Text color="income">Income</Text>
    </div>
  ),
};

export const TabularNumbers: Story = {
  args: { children: '£1,234.56', tabularNums: true, size: 'lg', weight: 'semibold' },
};

export const Uppercase: Story = {
  args: { children: 'category label', uppercase: true, size: 'xs', weight: 'semibold', color: 'secondary' },
};
