import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AVAILABLE_COLORS } from '@/lib/constants';
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().max(10).optional().default(''),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  defaultValues?: Category;
  onSubmit: (data: CategoryFormData) => void;
  isSubmitting: boolean;
}

export function CategoryForm({ defaultValues, onSubmit, isSubmitting }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues
      ? { name: defaultValues.name, color: defaultValues.color, icon: defaultValues.icon ?? '' }
      : { color: 'blue', icon: '' },
  });

  const colorValue = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g. Brewery Run" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <Select value={colorValue} onValueChange={(val) => setValue('color', val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_COLORS.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 rounded-full bg-${color}-500`}
                  />
                  <span className="capitalize">{color}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon (emoji, optional)</Label>
        <Input
          id="icon"
          placeholder="e.g. 🍺"
          maxLength={4}
          {...register('icon')}
        />
        <p className="text-xs text-muted-foreground">Paste or type an emoji to show alongside the category name.</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : defaultValues ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
