import { useState } from 'react';
import {
  useRecurringTemplates,
  useCreateRecurringTemplate,
  useUpdateRecurringTemplate,
  useDeleteRecurringTemplate,
} from '@/hooks/use-recurring';
import { ApiResponseError } from '@/lib/api';
import { RecurringForm } from '@/components/recurring/recurring-form';
import { InstancePreview } from '@/components/recurring/instance-preview';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Repeat, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DAY_NAMES } from '@/lib/constants';
import type { RecurringTemplate } from '@/types';

export function RecurringPage() {
  const { data: templates, isLoading } = useRecurringTemplates();
  const createTemplate = useCreateRecurringTemplate();
  const updateTemplate = useUpdateRecurringTemplate();
  const deleteTemplate = useDeleteRecurringTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<RecurringTemplate | undefined>();
  const [previewId, setPreviewId] = useState<number | null>(null);

  function openCreate() {
    setEditingTemplate(undefined);
    setDialogOpen(true);
  }

  function openEdit(template: RecurringTemplate) {
    setEditingTemplate(template);
    setDialogOpen(true);
  }

  async function handleSubmit(data: {
    routeId: number;
    dayOfWeek: number;
    startTime: string;
    endLocation?: string;
    notes?: string;
  }) {
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          version: editingTemplate.version,
          ...data,
        });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync(data);
        toast.success('Template created');
      }
      setDialogOpen(false);
    } catch (err) {
      if (err instanceof ApiResponseError && err.status === 409) {
        toast.error('Conflict: template was modified. Refreshing...');
      } else if (err instanceof ApiResponseError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      toast.success('Template deleted');
    } catch (err) {
      if (err instanceof ApiResponseError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
    setDeleteTarget(undefined);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Templates"
        description="Manage recurring event schedules"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !templates?.length ? (
        <EmptyState
          icon={Repeat}
          title="No recurring templates"
          description="Create a template to auto-generate events."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>End Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.route.name}</span>
                    <CategoryBadge category={template.route.category} />
                  </div>
                </TableCell>
                <TableCell>{DAY_NAMES[template.dayOfWeek]}</TableCell>
                <TableCell>{template.startTime}</TableCell>
                <TableCell>{template.endLocation ?? template.route.endLocation}</TableCell>
                <TableCell>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewId(previewId === template.id ? null : template.id)}
                      title="Preview instances"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(template)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {previewId && (
        <div className="rounded-lg border p-4">
          <InstancePreview templateId={previewId} />
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Recurring Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update template details.'
                : 'Set up a recurring event schedule.'}
            </DialogDescription>
          </DialogHeader>
          <RecurringForm
            template={editingTemplate}
            onSubmit={handleSubmit}
            isSubmitting={createTemplate.isPending || updateTemplate.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate or delete the recurring template. Existing events will not be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
