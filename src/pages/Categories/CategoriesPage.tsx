import { useEffect, useState } from 'react';
import { Tag, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { Heading, Button, Panel, DataRow, EmptyState } from '../../components';
import { useCategoriesStore } from '../../stores/useCategoriesStore';
import { CategoryFormDialog } from './CategoryFormDialog';
import type { Category } from '../../shared/types/models';
import styles from './CategoriesPage.module.css';

export function CategoriesPage() {
  const { categories, categoryTree, fetchCategories, deleteCategory } = useCategoriesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleDelete = (cat: Category) => {
    if (cat.isSystem) return;
    deleteCategory(cat.id);
  };

  const expenseTree = categoryTree.filter((c) => c.type === 'expense');
  const incomeTree = categoryTree.filter((c) => c.type === 'income');

  const renderCategoryRow = (cat: Category, indent = false) => (
    <DataRow
      key={cat.id}
      label={cat.name}
      sublabel={cat.isSystem ? 'System' : 'Custom'}
      icon={
        cat.color ? (
          <span className={styles.colorDot} style={{ background: cat.color }} />
        ) : undefined
      }
      rightSlot={
        !cat.isSystem ? (
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
              aria-label="Edit"
            >
              <PencilSimple size={14} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
              aria-label="Delete"
            >
              <Trash size={14} />
            </button>
          </div>
        ) : undefined
      }
      onClick={() => handleEdit(cat)}
      className={indent ? styles.indented : undefined}
    />
  );

  const renderTree = (nodes: typeof categoryTree) =>
    nodes.map((node) => (
      <div key={node.id}>
        {renderCategoryRow(node)}
        {node.children.map((child) => renderCategoryRow(child, true))}
      </div>
    ));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Heading level={2} size="lg" weight="semibold">
          Categories
        </Heading>
        <Button variant="secondary" icon={<Plus weight="bold" />} size="sm" onClick={handleAdd}>
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<Tag size={56} weight="duotone" />}
          heading="No categories"
          description="Categories help you organize and track spending patterns."
          action={<Button variant="primary" onClick={handleAdd}>Add Category</Button>}
        />
      ) : (
        <>
          <section>
            <h3 className={styles.sectionTitle}>Expense Categories</h3>
            <Panel padding={false}>{renderTree(expenseTree)}</Panel>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>Income Categories</h3>
            <Panel padding={false}>{renderTree(incomeTree)}</Panel>
          </section>
        </>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />
    </div>
  );
}
