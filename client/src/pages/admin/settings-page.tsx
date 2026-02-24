import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { useDefaultStartLocation, useUpdateSetting } from '@/hooks/use-settings';
import { CategoryForm } from '@/components/categories/category-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CATEGORY_COLOR_MAP } from '@/lib/constants';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/types';

export function SettingsPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const { data: defaultStartLocation, isLoading: settingsLoading } = useDefaultStartLocation();
  const updateSetting = useUpdateSetting();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | undefined>();
  const [locationInput, setLocationInput] = useState('');
  const [locationInitialized, setLocationInitialized] = useState(false);

  // Initialize locationInput from fetched default when first available
  if (!settingsLoading && !locationInitialized) {
    setLocationInput(defaultStartLocation ?? '');
    setLocationInitialized(true);
  }

  function openCreate() {
    setEditingCategory(undefined);
    setCategoryDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  }

  async function handleCategorySubmit(data: { name: string; color: string; icon?: string }) {
    try {
      const icon = data.icon ?? '';
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, name: data.name, color: data.color, icon });
        toast.success('Category updated');
      } else {
        await createCategory.mutateAsync({ name: data.name, color: data.color, icon });
        toast.success('Category created');
      }
      setCategoryDialogOpen(false);
    } catch {
      toast.error('Failed to save category');
    }
  }

  async function handleDeleteCategory() {
    if (!deleteTarget) return;
    await deleteCategory.mutateAsync(deleteTarget.id);
    if (!deleteCategory.isError) {
      toast.success('Category deleted');
    }
    setDeleteTarget(undefined);
  }

  async function handleSaveLocation() {
    try {
      await updateSetting.mutateAsync({ key: 'default_start_location', value: locationInput });
      toast.success('Default start location saved');
    } catch {
      toast.error('Failed to save start location');
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage categories and default configuration"
      />

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Categories
              </CardTitle>
              <CardDescription>Manage route and event categories</CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : !categories?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories yet. Create your first category to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const colors = CATEGORY_COLOR_MAP[category.color] ?? CATEGORY_COLOR_MAP['slate'];
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="text-xl">{category.icon || '—'}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-3 w-3 rounded-full ${colors.dot}`} />
                          <span className="capitalize text-sm text-muted-foreground">{category.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Default Start Location Section */}
      <Card>
        <CardHeader>
          <CardTitle>Default Start Location</CardTitle>
          <CardDescription>
            Pre-filled as the start location when creating new routes, events, and recurring templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-md">
            <div className="flex-1 space-y-2">
              <Label htmlFor="defaultStartLocation">Location</Label>
              <Input
                id="defaultStartLocation"
                placeholder="e.g. Astoria Park Track"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                disabled={settingsLoading}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSaveLocation}
                disabled={updateSetting.isPending || settingsLoading}
              >
                {updateSetting.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details.' : 'Create a new route/event category.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            defaultValues={editingCategory}
            onSubmit={handleCategorySubmit}
            isSubmitting={createCategory.isPending || updateCategory.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.
              If any routes use this category, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
