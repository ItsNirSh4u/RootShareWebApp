import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sprout, Plus, Pencil, Trash2, X, Search, FileImage,
  MessageCircle, Leaf, ArrowLeft, ExternalLink,
} from 'lucide-react';
import type { IPlantWithStats, IPostWithDetails, IPlantCreate } from '@rootshare/shared-types';
import { PlantStatus } from '@rootshare/shared-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PostModal } from '@/components/feed/PostModal';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchGardenPlants,
  fetchPlantPosts,
  createPlant,
  updatePlant,
  deletePlant,
  uploadPlantImage,
  fetchSpeciesList,
  identifyPlantSpecies,
} from './Garden/garden';

type StatusFilter = 'all' | PlantStatus;

const STATUS_LABELS: Record<PlantStatus, string> = {
  [PlantStatus.ACTIVE]: 'Active',
  [PlantStatus.DEAD]: 'Dead',
  [PlantStatus.GIFTED]: 'Gifted',
  [PlantStatus.SICK]: 'Sick',
};

const STATUS_BADGE: Record<PlantStatus, string> = {
  [PlantStatus.ACTIVE]: 'bg-emerald-500 text-white',
  [PlantStatus.DEAD]: 'bg-red-500 text-white',
  [PlantStatus.GIFTED]: 'bg-blue-500 text-white',
  [PlantStatus.SICK]: 'bg-yellow-400 text-white',
};

const STATUS_FILTER_ACTIVE: Record<PlantStatus, string> = {
  [PlantStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  [PlantStatus.DEAD]: 'bg-red-100 text-red-700 border-red-300',
  [PlantStatus.GIFTED]: 'bg-blue-100 text-blue-700 border-blue-300',
  [PlantStatus.SICK]: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type PlantCardProps = {
  plant: IPlantWithStats;
  onSelect: (plant: IPlantWithStats) => void;
  onEdit: (plant: IPlantWithStats) => void;
  onDelete: (plant: IPlantWithStats) => void;
};

function PlantCard({ plant, onSelect, onEdit, onDelete }: PlantCardProps): JSX.Element {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4] bg-bg-subtle shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      onClick={() => onSelect(plant)}
    >
      {plant.imageUrl ? (
        <img
          src={plant.imageUrl}
          alt={plant.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <Leaf size={48} className="text-primary/40" aria-hidden />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <span className={cn('absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_BADGE[plant.status])}>
        {STATUS_LABELS[plant.status]}
      </span>

      <div
        className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onEdit(plant)}
          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-text-base hover:bg-white transition-colors shadow"
          aria-label="Edit plant"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(plant)}
          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white transition-colors shadow"
          aria-label="Delete plant"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm truncate leading-tight">{plant.name}</p>
        <p className="text-white/70 text-xs italic truncate">{plant.species}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-white/80 text-xs">
            <Sprout size={12} aria-hidden />
            {plant.postsCount}
          </span>
          <span className="flex items-center gap-1 text-white/80 text-xs">
            <MessageCircle size={12} aria-hidden />
            {plant.commentsCount}
          </span>
        </div>
      </div>
    </div>
  );
}

type PlantDetailPanelProps = {
  plant: IPlantWithStats;
  currentUserId: string;
  onClose: () => void;
  onEdit: (plant: IPlantWithStats) => void;
  onDelete: (plant: IPlantWithStats) => void;
};

function PlantDetailPanel({ plant, currentUserId, onClose, onEdit, onDelete }: PlantDetailPanelProps): JSX.Element {
  const [selectedPost, setSelectedPost] = useState<IPostWithDetails | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['garden', 'plant-posts', plant.id],
    queryFn: () => fetchPlantPosts(plant.id),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />

      <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-bg-card border-l border-border-default z-40 flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-muted flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-base hover:bg-bg-muted transition-colors"
            aria-label="Close panel"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold text-text-base flex-1 truncate">{plant.name}</h2>
          <div className="flex gap-1.5">
            <Button size="icon" variant="ghost" onClick={() => onEdit(plant)} aria-label="Edit plant">
              <Pencil size={15} className="text-text-muted" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(plant)} aria-label="Delete plant">
              <Trash2 size={15} className="text-destructive" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="relative aspect-video bg-bg-subtle flex-shrink-0">
            {plant.imageUrl ? (
              <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf size={56} className="text-primary/30" aria-hidden />
              </div>
            )}
            <span className={cn('absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full', STATUS_BADGE[plant.status])}>
              {STATUS_LABELS[plant.status]}
            </span>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-bold text-text-base">{plant.name}</h3>
              <p className="text-sm text-text-muted italic mt-0.5">{plant.species}</p>
              <p className="text-xs text-text-subtle mt-1">Since {formatDate(plant.createdAt)}</p>
            </div>

            <div className="flex gap-4 py-3 border-y border-border-muted">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 text-primary">
                  <Sprout size={16} aria-hidden />
                  <span className="text-lg font-bold">{plant.postsCount}</span>
                </div>
                <span className="text-xs text-text-muted">Posts</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 text-blue-500">
                  <MessageCircle size={16} aria-hidden />
                  <span className="text-lg font-bold">{plant.commentsCount}</span>
                </div>
                <span className="text-xs text-text-muted">Comments</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Related Posts</h4>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : !posts || posts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-text-muted">
                  <Sprout size={32} className="opacity-30" aria-hidden />
                  <p className="text-sm">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="group/post text-left bg-bg-subtle border border-border-default rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
                    >
                      {post.images[0] ? (
                        <img src={post.images[0]} alt="" className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-bg-muted flex items-center justify-center">
                          <Leaf size={24} className="text-text-muted/40" aria-hidden />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs text-text-base line-clamp-2 leading-snug">{post.content}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-text-muted">{post.likesCount} ♥</span>
                          <ExternalLink size={11} className="text-text-muted opacity-0 group-hover/post:opacity-100 transition-opacity" aria-hidden />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {selectedPost && (
        <PostModal
          mode="view"
          post={selectedPost}
          currentUserId={currentUserId}
          onClose={() => setSelectedPost(null)}
          onSuccess={() => {
            setSelectedPost(null);
            queryClient.invalidateQueries({ queryKey: ['garden', 'plant-posts', plant.id] });
          }}
        />
      )}
    </>
  );
}

type PlantFormModalProps = {
  plant?: IPlantWithStats;
  onClose: () => void;
  onSuccess: () => void;
};

function PlantFormModal({ plant, onClose, onSuccess }: PlantFormModalProps): JSX.Element {
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!plant;

  const [name, setName] = useState(plant?.name ?? '');
  const [species, setSpecies] = useState(plant?.species ?? '');
  const [status, setStatus] = useState<PlantStatus>(plant?.status ?? PlantStatus.ACTIVE);
  const [imageUrl, setImageUrl] = useState(plant?.imageUrl ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [speciesLocked, setSpeciesLocked] = useState(false);

  const { data: speciesList } = useQuery({
    queryKey: ['species'],
    queryFn: fetchSpeciesList,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), species: species.trim(), imageUrl };
      if (isEdit) {
        return updatePlant(plant.id, { ...payload, status });
      }
      const created = await createPlant(payload as IPlantCreate);
      if (status !== PlantStatus.ACTIVE) {
        await updatePlant(created.id, { status });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden', 'plants'] });
      onSuccess();
      onClose();
    },
  });

  async function handleImageClick() {
    imageInputRef.current?.click();
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImageFile(file);
    setSpeciesLocked(false);
    setImageUploading(true);
    try {
      const url = await uploadPlantImage(file);
      setImageUrl(url);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleIdentify() {
    if (!imageFile) return;
    setIsIdentifying(true);
    try {
      const { species: result, status: detectedStatus } = await identifyPlantSpecies(imageFile);
      const match = speciesList?.find((s) => result.toLowerCase().includes(s.toLowerCase()));
      if (match) {
        setSpecies(match);
        setSpeciesLocked(true);
        setStatus(detectedStatus);
      } else {
        toast.error('Could not identify species. Please select manually.');
      }
    } catch {
      toast.error('AI recognition failed. Please try again.');
    } finally {
      setIsIdentifying(false);
    }
  }

  const canSubmit = name.trim() && species.trim() && imageUrl && !imageUploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card border border-border-default rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted">
          <h2 className="text-base font-semibold text-text-base">
            {isEdit ? 'Edit Plant' : 'Add Plant'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-base transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <button
            type="button"
            onClick={handleImageClick}
            className="relative w-full aspect-video rounded-xl overflow-hidden bg-bg-subtle border-2 border-dashed border-border-default hover:border-primary/50 transition-colors group"
          >
            {imageUploading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            ) : imageUrl ? (
              <>
                <img src={imageUrl} alt="Plant preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileImage size={28} className="text-white" aria-hidden />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted group-hover:text-primary transition-colors">
                <FileImage size={32} aria-hidden />
                <span className="text-sm font-medium">Click to upload photo</span>
              </div>
            )}
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Plant name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Monstera"
              autoFocus={!isEdit}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted">Species</label>
              <button
                type="button"
                onClick={handleIdentify}
                disabled={!imageUrl || isIdentifying}
                className={cn(
                  'text-xs underline leading-none',
                  imageUrl && !isIdentifying
                    ? 'text-primary cursor-pointer hover:opacity-80'
                    : 'text-text-muted cursor-default',
                )}
              >
                {isIdentifying ? 'Identifying…' : "Don't know the species? Use AI"}
              </button>
            </div>
            <div className="relative">
              <input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="e.g. Monstera deliciosa"
                list="species-list"
                disabled={speciesLocked}
                className={cn(
                  'w-full h-10 text-sm border border-border-default rounded-lg px-3 bg-bg-main text-text-base focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted',
                  speciesLocked && 'opacity-60 cursor-not-allowed pr-8',
                )}
              />
              {speciesLocked && (
                <button
                  type="button"
                  onClick={() => setSpeciesLocked(false)}
                  aria-label="Unlock species"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {speciesList && (
              <datalist id="species-list">
                {speciesList.map((s) => <option key={s} value={s} />)}
              </datalist>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Status</label>
            <div className="relative">
              <input
                value={STATUS_LABELS[status]}
                onChange={(e) => {
                  const matched = (Object.entries(STATUS_LABELS) as [PlantStatus, string][]).find(([, v]) => v === e.target.value);
                  if (matched) setStatus(matched[0]);
                }}
                list="status-list"
                disabled={speciesLocked}
                className={cn(
                  'w-full h-10 text-sm border border-border-default rounded-lg px-3 bg-bg-main text-text-base focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted',
                  speciesLocked && 'opacity-60 cursor-not-allowed pr-8',
                )}
              />
              {speciesLocked && (
                <button
                  type="button"
                  onClick={() => setSpeciesLocked(false)}
                  aria-label="Unlock status"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <datalist id="status-list">
              {(isEdit ? Object.values(PlantStatus) : [PlantStatus.ACTIVE, PlantStatus.SICK, PlantStatus.DEAD]).map((s) => (
                <option key={s} value={STATUS_LABELS[s]} />
              ))}
            </datalist>
          </div>

          {saveMutation.isError && <ErrorAlert message="Failed to save plant. Check that the species is in the approved list." />}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              disabled={!canSubmit}
            >
              {isEdit ? 'Save' : 'Add Plant'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DeleteConfirmProps = {
  plant: IPlantWithStats;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

function DeleteConfirm({ plant, onCancel, onConfirm, isLoading }: DeleteConfirmProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-bg-card border border-border-default rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-text-base">Delete {plant.name}?</h3>
        <p className="text-sm text-text-muted">This will permanently delete this plant and cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isLoading}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

export function InventoryPage(): JSX.Element {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<IPlantWithStats | null>(null);
  const [editingPlant, setEditingPlant] = useState<IPlantWithStats | undefined>(undefined);
  const [deletingPlant, setDeletingPlant] = useState<IPlantWithStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: plants, isLoading, error } = useQuery({
    queryKey: ['garden', 'plants'],
    queryFn: fetchGardenPlants,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden', 'plants'] });
      setDeletingPlant(null);
      if (selectedPlant?.id === deletingPlant?.id) setSelectedPlant(null);
    },
  });

  const filtered = plants?.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.species.toLowerCase().includes(q);
    }
    return true;
  }) ?? [];

  const counts = {
    total: plants?.length ?? 0,
    active: plants?.filter((p) => p.status === PlantStatus.ACTIVE).length ?? 0,
    dead: plants?.filter((p) => p.status === PlantStatus.DEAD).length ?? 0,
    gifted: plants?.filter((p) => p.status === PlantStatus.GIFTED).length ?? 0,
    sick: plants?.filter((p) => p.status === PlantStatus.SICK).length ?? 0,
  };

  function handleEdit(plant: IPlantWithStats) {
    setSelectedPlant(null);
    setEditingPlant(plant);
  }

  function handleDeleteRequest(plant: IPlantWithStats) {
    setSelectedPlant(null);
    setDeletingPlant(plant);
  }

  const livePlant = selectedPlant && plants
    ? (plants.find((p) => p.id === selectedPlant.id) ?? selectedPlant)
    : null;

  if (!user) return <div />;

  return (
    <div className="min-h-full bg-bg-main flex flex-col">
      <header className="bg-bg-card border-b border-border-default px-4 lg:px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sprout size={22} className="text-primary" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-base">My Garden</h1>
              <p className="text-xs text-text-muted mt-0.5">{counts.total} plants total</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5 flex-shrink-0">
            <Plus size={15} />
            <span className="hidden sm:inline">Add Plant</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { label: `${counts.active} Active`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { label: `${counts.sick} Sick`, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
            { label: `${counts.dead} Dead`, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
            { label: `${counts.gifted} Gifted`, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
          ].map(({ label, color, bg, border }) => (
            <span key={label} className={cn('text-xs font-medium px-3 py-1 rounded-full border', color, bg, border)}>
              {label}
            </span>
          ))}
        </div>
      </header>

      <div className="sticky top-0 z-10 bg-bg-subtle border-b border-border-muted px-4 lg:px-8 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {(['all', PlantStatus.ACTIVE, PlantStatus.SICK, PlantStatus.DEAD, PlantStatus.GIFTED] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                filter === f
                  ? f === 'all'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : STATUS_FILTER_ACTIVE[f as PlantStatus]
                  : 'bg-bg-card text-text-muted border-border-default hover:border-primary/30 hover:text-text-base',
              )}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f as PlantStatus]}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plants…"
            className="pl-8 pr-3 py-1.5 text-xs border border-border-default rounded-full bg-bg-card text-text-base focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted w-40 sm:w-52"
          />
        </div>
      </div>

      <main className="flex-1 px-4 lg:px-8 py-5">
        {error ? (
          <ErrorAlert message="Failed to load plants" />
        ) : isLoading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
              <Sprout size={40} className="text-primary/30" aria-hidden />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-text-base">
                {search || filter !== 'all' ? 'No plants match your filter' : 'No plants yet'}
              </p>
              {!search && filter === 'all' && (
                <p className="text-sm mt-1">Add your first plant to get started</p>
              )}
            </div>
            {!search && filter === 'all' && (
              <Button onClick={() => setShowAddForm(true)} className="gap-1.5 mt-2">
                <Plus size={15} />
                Add Plant
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onSelect={setSelectedPlant}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </main>

      {livePlant && (
        <PlantDetailPanel
          plant={livePlant}
          currentUserId={user.id}
          onClose={() => setSelectedPlant(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {(showAddForm || editingPlant) && (
        <PlantFormModal
          plant={editingPlant}
          onClose={() => { setShowAddForm(false); setEditingPlant(undefined); }}
          onSuccess={() => { setEditingPlant(undefined); }}
        />
      )}

      {deletingPlant && (
        <DeleteConfirm
          plant={deletingPlant}
          onCancel={() => setDeletingPlant(null)}
          onConfirm={() => deleteMutation.mutate(deletingPlant.id)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
