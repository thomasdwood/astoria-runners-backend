import { useState } from 'react';
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '@/hooks/use-routes';
import { ApiResponseError } from '@/lib/api';
import { RouteForm } from '@/components/routes/route-form';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
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
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Route } from '@/types';

export function RoutesPage() {
  const { data: routes, isLoading } = useRoutes();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Route | undefined>();

  function openCreate() {
    setEditingRoute(undefined);
    setDialogOpen(true);
  }

  function openEdit(route: Route) {
    setEditingRoute(route);
    setDialogOpen(true);
  }

  async function handleSubmit(data: { name: string; distance: number; categoryId: number; startLocation?: string; endLocation?: string }) {
    try {
      if (editingRoute) {
        await updateRoute.mutateAsync({ id: editingRoute.id, version: editingRoute.version, ...data });
        toast.success('Route updated');
      } else {
        await createRoute.mutateAsync(data);
        toast.success('Route created');
      }
      setDialogOpen(false);
    } catch (err) {
      if (err instanceof ApiResponseError && err.status === 409) {
        toast.error('Conflict: route was modified by another user. Refreshing...');
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
      await deleteRoute.mutateAsync(deleteTarget.id);
      toast.success('Route deleted');
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
        title="Routes"
        description="Manage running routes"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !routes?.length ? (
        <EmptyState
          icon={MapPin}
          title="No routes yet"
          description="Create your first running route to get started."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Route
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>End Location</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-medium">{route.name}</TableCell>
                <TableCell>{route.distance} mi</TableCell>
                <TableCell>
                  <CategoryBadge category={route.category} />
                </TableCell>
                <TableCell>{route.endLocation}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(route)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(route)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Edit Route' : 'Create Route'}</DialogTitle>
            <DialogDescription>
              {editingRoute ? 'Update route details.' : 'Add a new running route.'}
            </DialogDescription>
          </DialogHeader>
          <RouteForm
            route={editingRoute}
            onSubmit={handleSubmit}
            isSubmitting={createRoute.isPending || updateRoute.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
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
