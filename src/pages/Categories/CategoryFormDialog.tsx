import { useState, useEffect } from 'react';
import { Dialog, Input, Select, Button } from '../../components';
import type { SelectOption } from '../../components';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import type { Category } from '../../shared/types/models';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const COLOR_PRESETS = [
  '#005bc1', '#1e40af', '#7c3aed', '#db2777',
  '#9f403d', '#b45309', '#15803d', '#0d9488',
  '#0284c7', '#6366f1', '#a855f7', '#f97316',
  '#ef4444', '#84cc16', '#06b6d4', '#8b5cf6',
];

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const { categories, createCategory, updateCategory } = useCategoriesStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [parentId, setParentId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!category;
  const isSystem = category?.isSystem ?? false;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color ?? COLOR_PRESETS[0]);
      setParentId(category.parentId ?? '__none__');
    } else {
      setName('');
      setType('expense');
      setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
      setParentId('__none__');
    }
    setErrors({});
  }, [category, open]);

  const parentOptions: SelectOption[] = [
    { value: '__none__', label: 'None (Top Level)' },
    ...categories
      .filter((c) => c.type === type && !c.parentId && c.id !== category?.id)
      .map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    if (isEditing && category) {
      updateCategory(category.id, {
        name: name.trim(),
        type,
        color,
        parentId: parentId === '__none__' ? null : parentId,
      });
    } else {
      createCategory({
        name: name.trim(),
        type,
        color,
        parentId: parentId === '__none__' ? undefined : parentId,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Category' : 'Add Category'}
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g. Coffee, Gym"
          disabled={isSystem}
        />

        <Select
          label="Type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(v) => setType(v as 'expense' | 'income')}
          disabled={isSystem}
        />

        <Select
          label="Parent Category"
          options={parentOptions}
          value={parentId || '__none__'}
          onChange={setParentId}
          placeholder="None (Top Level)"
        />

        <div>
          <label style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
            display: 'block',
            marginBottom: 'var(--space-2)',
          }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <Dialog.Footer>
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save' : 'Add Category'}
          </Button>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
}
