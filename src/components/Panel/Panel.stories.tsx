import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from './Panel';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';

const meta: Meta<typeof Panel> = {
  title: 'Components/Panel',
  component: Panel,
  argTypes: {
    variant: { control: 'select', options: ['default', 'elevated', 'accent'] },
  },
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Heading level={3} size="md">Monthly Overview</Heading>
        <Text color="secondary">Your spending summary for March 2026.</Text>
      </>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <Heading level={3} size="md">Account Balance</Heading>
        <Text size="lg" weight="bold">£4,230.50</Text>
      </>
    ),
  },
};

export const Accent: Story = {
  args: {
    variant: 'accent',
    children: <Text color="on-accent" weight="semibold">Quick Add: Log a new transaction</Text>,
  },
};

export const NoPadding: Story = {
  args: {
    padding: false,
    children: <div style={{ padding: '16px' }}>Custom padding content</div>,
  },
};
