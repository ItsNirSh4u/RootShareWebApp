import { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PostType } from '@rootshare/shared-types';
import type { IPostCreate } from '@rootshare/shared-types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { fetchUserPlants, createPost } from '@/pages/Feed/feed';

const TYPE_OPTIONS: { value: PostType; label: string; activeClass: string }[] = [
  { value: PostType.UPDATE, label: 'Update', activeClass: 'bg-primary/10 text-primary border-primary/30' },
  { value: PostType.SWAP, label: 'Swap', activeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: PostType.GIVEAWAY, label: 'Giveaway', activeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const TEXTAREA_CLASS =
  'w-full rounded-md border bg-bg-main px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none';

const SELECT_CLASS =
  'w-full h-10 rounded-md border border-border-input bg-bg-main px-3 py-2 text-sm text-text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps): JSX.Element | null {
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType | ''>('');
  const [plantId, setPlantId] = useState('');
  const [errors, setErrors] = useState<{ content?: string; type?: string }>({});

  const { data: plants } = useQuery({
    queryKey: ['plants', 'user'],
    queryFn: fetchUserPlants,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    setContent('');
    setType('');
    setPlantId('');
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const next: { content?: string; type?: string } = {};
    if (!content.trim()) next.content = 'Content is required';
    if (!type) next.type = 'Post type is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !type) return;
    const dto: IPostCreate = { content: content.trim(), type, images: [] };
    if (plantId) dto.plantId = plantId;
    mutation.mutate(dto);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />

      <div className="relative w-full md:max-w-lg bg-bg-card rounded-t-2xl md:rounded-xl shadow-soft-lg p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-base">New Post</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-text-muted hover:text-text-base transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-text-base mb-1.5">Type</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(({ value, label, activeClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setType(value);
                    setErrors((prev) => ({ ...prev, type: undefined }));
                  }}
                  className={cn(
                    'flex-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                    type === value
                      ? activeClass
                      : 'border-border-default text-text-muted hover:bg-bg-subtle',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.type && <p className="mt-1.5 text-sm text-destructive">{errors.type}</p>}
          </div>

          <div>
            <label htmlFor="post-content" className="block text-sm font-medium text-text-base mb-1.5">
              Content
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              rows={4}
              placeholder="What's happening with your plants?"
              className={cn(TEXTAREA_CLASS, errors.content ? 'border-destructive focus:ring-destructive' : 'border-border-input')}
            />
            {errors.content && <p className="mt-1.5 text-sm text-destructive">{errors.content}</p>}
          </div>

          {plants && plants.length > 0 && (
            <div>
              <label htmlFor="post-plant" className="block text-sm font-medium text-text-base mb-1.5">
                Plant <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <select
                id="post-plant"
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">No plant selected</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-destructive">Failed to create post. Please try again.</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={mutation.isPending}>
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
