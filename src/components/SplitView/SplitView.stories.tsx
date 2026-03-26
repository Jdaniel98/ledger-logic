import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitView } from './SplitView';

const Placeholder = ({ label, bg }: { label: string; bg: string }) => (
  <div style={{ padding: '24px', background: bg, height: '100%', minHeight: '400px' }}>
    <strong>{label}</strong>
  </div>
);

const meta: Meta<typeof SplitView> = {
  title: 'Components/SplitView',
  component: SplitView,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SplitView>;

export const Default: Story = {
  args: {
    sidebar: <Placeholder label="Sidebar" bg="var(--color-bg-sidebar)" />,
    main: <Placeholder label="Main Content" bg="var(--color-bg-main)" />,
  },
};

export const WithInspector: Story = {
  args: {
    sidebar: <Placeholder label="Sidebar" bg="var(--color-bg-sidebar)" />,
    main: <Placeholder label="Main Content" bg="var(--color-bg-main)" />,
    inspector: <Placeholder label="Inspector" bg="var(--color-bg-card-1)" />,
    inspectorOpen: true,
  },
};
