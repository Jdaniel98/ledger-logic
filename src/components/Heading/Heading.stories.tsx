import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';

const meta: Meta<typeof Heading> = {
  title: 'Components/Heading',
  component: Heading,
  argTypes: {
    level: { control: 'select', options: [1, 2, 3, 4, 5, 6] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    weight: { control: 'select', options: ['semibold', 'bold'] },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: { children: 'Dashboard Overview', level: 2, size: 'lg' },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Heading size="xl">Extra Large Heading</Heading>
      <Heading size="lg">Large Heading</Heading>
      <Heading size="md">Medium Heading</Heading>
      <Heading size="sm">Small Heading</Heading>
    </div>
  ),
};
