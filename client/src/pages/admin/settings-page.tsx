import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { useHosts, useCreateHost, useDeleteHost } from '@/hooks/use-hosts';
import { useSettings, useUpdateSetting } from '@/hooks/use-settings';
import { CategoryForm } from '@/components/categories/category-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Tags, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Host } from '@/types';

export function SettingsPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const { data: hosts, isLoading: hostsLoading } = useHosts();
  const createHost = useCreateHost();
  const deleteHost = useDeleteHost();

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  const defaultStartLocation = settings?.find((s) => s.key === 'default_start_location')?.value ?? null;
  const discordNotificationsRaw = settings?.find((s) => s.key === 'discord_notifications_enabled')?.value;
  // Default to enabled (true) if setting doesn't exist
  const discordNotificationsEnabled = discordNotificationsRaw !== 'false';
  const meetupTemplate = settings?.find((s) => s.key === 'meetup_description_template')?.value ?? '';

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | undefined>();
  const [locationInput, setLocationInput] = useState('');
  const [locationInitialized, setLocationInitialized] = useState(false);

  const [hostDialogOpen, setHostDialogOpen] = useState(false);
  const [hostNameInput, setHostNameInput] = useState('');
  const [hostEmailInput, setHostEmailInput] = useState('');
  const [deleteHostTarget, setDeleteHostTarget] = useState<Host | undefined>();

  const [templateInput, setTemplateInput] = useState('');
  const [templateInitialized, setTemplateInitialized] = useState(false);

  // Initialize locationInput from fetched default when first available
  if (!settingsLoading && !locationInitialized) {
    setLocationInput(defaultStartLocation ?? '');
    setLocationInitialized(true);
  }

  // Initialize templateInput once settings load
  if (!templateInitialized && meetupTemplate) {
    setTemplateInput(meetupTemplate);
    setTemplateInitialized(true);
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

  async function handleDiscordToggle(enabled: boolean) {
    try {
      await updateSetting.mutateAsync({ key: 'discord_notifications_enabled', value: enabled ? 'true' : 'false' });
      toast.success(`Discord notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update Discord notification setting');
    }
  }

  async function handleCreateHost() {
    if (!hostNameInput.trim()) return;
    try {
      await createHost.mutateAsync({
        name: hostNameInput.trim(),
        email: hostEmailInput.trim() || null,
      });
      toast.success('Host created');
      setHostDialogOpen(false);
      setHostNameInput('');
      setHostEmailInput('');
    } catch {
      toast.error('Failed to create host');
    }
  }

  async function handleDeleteHost() {
    if (!deleteHostTarget) return;
    try {
      await deleteHost.mutateAsync(deleteHostTarget.id);
      toast.success('Host deleted');
    } catch {
      toast.error('Failed to delete host');
    }
    setDeleteHostTarget(undefined);
  }

  async function handleSaveTemplate() {
    try {
      await updateSetting.mutateAsync({ key: 'meetup_description_template', value: templateInput });
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
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

      {/* Hosts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Hosts
              </CardTitle>
              <CardDescription>Manage run hosts. Hosts can be assigned to events.</CardDescription>
            </div>
            <Button onClick={() => setHostDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Host
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hostsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : !hosts?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No hosts yet. Add your first host to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell className="font-medium">{host.name}</TableCell>
                    <TableCell className="text-muted-foreground">{host.email ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteHostTarget(host)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Meetup Description Template Section */}
      <Card>
        <CardHeader>
          <CardTitle>Meetup Description Template</CardTitle>
          <CardDescription>
            Template used when generating Meetup event descriptions. Use {'{{variable}}'} placeholders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetupTemplate">Template</Label>
            <Textarea
              id="meetupTemplate"
              rows={8}
              value={templateInput}
              onChange={(e) => setTemplateInput(e.target.value)}
              placeholder="Enter your Meetup description template..."
              disabled={settingsLoading}
            />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Available variables:</p>
            <p>
              <code>{'{{routeName}}'}</code>, <code>{'{{distance}}'}</code>,{' '}
              <code>{'{{startLocation}}'}</code>, <code>{'{{endLocation}}'}</code>,{' '}
              <code>{'{{host}}'}</code>, <code>{'{{routeLink}}'}</code>,{' '}
              <code>{'{{notes}}'}</code>
            </p>
          </div>
          <Button
            onClick={handleSaveTemplate}
            disabled={updateSetting.isPending || settingsLoading}
          >
            {updateSetting.isPending ? 'Saving...' : 'Save Template'}
          </Button>
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

      {/* Discord Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle>Discord Notifications</CardTitle>
          <CardDescription>
            Post event announcements to Discord when events are created, updated, or deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Switch
              id="discordNotifications"
              checked={discordNotificationsEnabled}
              onCheckedChange={handleDiscordToggle}
              disabled={settingsLoading || updateSetting.isPending}
            />
            <Label htmlFor="discordNotifications" className="cursor-pointer">
              {discordNotificationsEnabled ? 'Enabled' : 'Disabled'}
            </Label>
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

      {/* Delete Category Confirmation */}
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

      {/* Add Host Dialog */}
      <Dialog
        open={hostDialogOpen}
        onOpenChange={(open) => {
          setHostDialogOpen(open);
          if (!open) {
            setHostNameInput('');
            setHostEmailInput('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Host</DialogTitle>
            <DialogDescription>Add a new run host.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hostName">Name <span className="text-destructive">*</span></Label>
              <Input
                id="hostName"
                placeholder="Host name"
                value={hostNameInput}
                onChange={(e) => setHostNameInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hostEmail">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="hostEmail"
                type="email"
                placeholder="host@example.com"
                value={hostEmailInput}
                onChange={(e) => setHostEmailInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setHostDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateHost}
                disabled={!hostNameInput.trim() || createHost.isPending}
              >
                {createHost.isPending ? 'Adding...' : 'Add Host'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Host Confirmation */}
      <AlertDialog
        open={!!deleteHostTarget}
        onOpenChange={(open) => !open && setDeleteHostTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Host</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteHostTarget?.name}&quot;?
              This will remove the host from any assigned events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHost}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
