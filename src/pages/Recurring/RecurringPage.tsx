import { useEffect, useState } from 'react';
import { Plus, Repeat, PencilSimple, Trash } from '@phosphor-icons/react';
import { Heading, Button, Panel, Text, CurrencyDisplay, EmptyState, Skeleton } from '../../components';
import { useRecurringStore } from '../../stores/useRecurringStore';
import { RecurringFormDialog } from './RecurringFormDialog';
import type { RecurringTemplate } from '../../shared/types/models';
import styles from './RecurringPage.module.css';

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function RecurringPage() {
  const { templates, isLoading, fetchTemplates, updateTemplate, deleteTemplate } = useRecurringStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEdit = (template: RecurringTemplate) => {
    setEditing(template);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleToggle = (template: RecurringTemplate) => {
    updateTemplate(template.id, { isActive: !template.isActive });
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">Recurring</Heading>
        <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
          Add Recurring
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.skeletons}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<Repeat size={56} weight="duotone" />}
          heading="No recurring transactions"
          description="Set up recurring transactions for bills, subscriptions, and regular income to auto-track them each period."
          action={
            <Button variant="primary" icon={<Plus weight="bold" />} onClick={handleAdd}>
              Add Recurring
            </Button>
          }
        />
      ) : (
        <Panel padding={false}>
          {templates.map((template) => (
            <div key={template.id} className={styles.templateRow}>
              <div className={styles.templateInfo}>
                <Text weight="medium">
                  {template.payee || template.description || 'Untitled'}
                </Text>
                <Text size="xs" color="secondary">
                  Next: {template.nextDueDate ?? 'N/A'}
                  {template.endDate && ` · Ends: ${template.endDate}`}
                </Text>
              </div>

              <CurrencyDisplay
                amount={template.type === 'expense' ? -template.amount : template.amount}
                size="sm"
                weight="semibold"
                colorize
              />

              <span className={styles.frequencyBadge}>
                {FREQUENCY_LABELS[template.frequency] ?? template.frequency}
              </span>

              <button
                className={styles.toggle}
                data-active={template.isActive}
                onClick={() => handleToggle(template)}
                aria-label={template.isActive ? 'Deactivate' : 'Activate'}
              >
                <span className={styles.toggleKnob} />
              </button>

              <div className={styles.actions}>
                <button
                  className={styles.iconBtn}
                  onClick={() => handleEdit(template)}
                  aria-label="Edit"
                >
                  <PencilSimple size={16} />
                </button>
                <button
                  className={styles.iconBtn}
                  data-danger
                  onClick={() => handleDelete(template.id)}
                  aria-label="Delete"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </Panel>
      )}

      <RecurringFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
      />
    </div>
  );
}
