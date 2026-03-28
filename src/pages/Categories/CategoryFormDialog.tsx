import { useState, useEffect } from 'react';
import { Dialog, Input, Select, Button } from '../../components';
import type { SelectOption } from '../../components';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import type { Category } from '../../shared/types/models';
import formStyles from '../../styles/form-dialog.module.css';

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
      <form onSubmit={handleSubmit} className={formStyles.form}>
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
          <label className={formStyles.colorLabel}>Color</label>
          <div className={formStyles.colorGrid}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={formStyles.colorSwatch}
                data-selected={color === c || undefined}
                style={{ background: c }}
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
