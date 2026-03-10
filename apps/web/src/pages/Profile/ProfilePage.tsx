import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Check, X, Leaf, Sprout, Camera, Plus } from 'lucide-react';
import type { IPostWithDetails, IPlant } from '@rootshare/shared-types';
import { PlantStatus, PostType } from '@rootshare/shared-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Spinner } from '@/components/ui/Spinner';
import { PostModal } from '@/components/feed/PostModal';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { fetchUserPosts, fetchUserPlants, updateProfile, uploadProfileImage } from './profile';

type Tab = 'posts' | 'plants';

function CardSkeleton(): JSX.Element {
  return <div className="animate-pulse bg-bg-muted rounded-lg h-40" />;
}

function getInitials(username: string): string {
  return username
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

type PostTypeBadgeProps = { type: PostType };

function PostTypeBadge({ type }: PostTypeBadgeProps): JSX.Element {
  const styles: Record<PostType, string> = {
    [PostType.UPDATE]: 'bg-blue-100 text-blue-700',
    [PostType.SWAP]: 'bg-amber-100 text-amber-700',
    [PostType.GIVEAWAY]: 'bg-green-100 text-green-700',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', styles[type])}>
      {type}
    </span>
  );
}

type PlantStatusBadgeProps = { status: PlantStatus };

function PlantStatusBadge({ status }: PlantStatusBadgeProps): JSX.Element {
  const styles: Record<PlantStatus, string> = {
    [PlantStatus.ACTIVE]: 'bg-green-100 text-green-700',
    [PlantStatus.DEAD]: 'bg-red-100 text-red-700',
    [PlantStatus.GIFTED]: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', styles[status])}>
      {status}
    </span>
  );
}

type ProfilePostCardProps = { post: IPostWithDetails; onClick: (post: IPostWithDetails) => void };

function ProfilePostCard({ post, onClick }: ProfilePostCardProps): JSX.Element {
  return (
    <div
      className="bg-bg-card border border-border-default rounded-lg overflow-hidden flex flex-col cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => onClick(post)}
    >
      {post.images[0] && (
        <img src={post.images[0]} alt="Post" className="w-full h-32 object-cover" />
      )}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <PostTypeBadge type={post.type} />
          <span className="text-xs text-text-muted">{formatDate(post.createdAt)}</span>
        </div>
        <p className="text-sm text-text-base line-clamp-2 flex-1">{post.content}</p>
        <span className="text-xs text-text-muted">{post.likesCount} likes</span>
      </div>
    </div>
  );
}

type PlantCardProps = { plant: IPlant };

function PlantCard({ plant }: PlantCardProps): JSX.Element {
  return (
    <div className="bg-bg-card border border-border-default rounded-lg overflow-hidden flex flex-col">
      {plant.imageUrl && (
        <img src={plant.imageUrl} alt={plant.name} className="w-full h-32 object-cover" />
      )}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text-base truncate">{plant.name}</span>
          <PlantStatusBadge status={plant.status} />
        </div>
        <span className="text-xs text-text-muted italic truncate">{plant.species}</span>
      </div>
    </div>
  );
}

export function ProfilePage(): JSX.Element {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId] = useState(() => user?.id);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState(user?.username ?? '');
  const [selectedPost, setSelectedPost] = useState<IPostWithDetails | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ['profile', 'posts', userId],
    queryFn: () => fetchUserPosts(userId!),
    enabled: !!userId,
  });

  const {
    data: plants,
    isLoading: plantsLoading,
    error: plantsError,
  } = useQuery({
    queryKey: ['profile', 'plants'],
    queryFn: fetchUserPlants,
    enabled: !!userId,
  });

  const updateUsernameMutation = useMutation({
    mutationFn: (username: string) => updateProfile({ username }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setEditingUsername(false);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
    },
  });

  const avatarSrc = user?.localProfileImageUrl ?? user?.profileImageUrl;

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
    e.target.value = '';
  }

  function handleEditUsername() {
    setUsernameValue(user?.username ?? '');
    setEditingUsername(true);
  }

  function handleCancelEdit() {
    setEditingUsername(false);
    setUsernameValue(user?.username ?? '');
  }

  function handleSaveUsername() {
    if (usernameValue.trim() && usernameValue.trim() !== user?.username) {
      updateUsernameMutation.mutate(usernameValue.trim());
    } else {
      setEditingUsername(false);
    }
  }

  function handlePostMutationSuccess() {
    queryClient.invalidateQueries({ queryKey: ['profile', 'posts', userId] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }

  if (!user) return <div />;

  return (
    <div className="min-h-full bg-bg-main">
      <div className="max-w-screen-lg mx-auto px-4 lg:px-6 py-8">
        <div className="bg-bg-card border border-border-default rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative w-24 h-24 rounded-full overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Upload profile picture"
              >
                {uploadImageMutation.isPending ? (
                  <div className="w-24 h-24 rounded-full bg-bg-muted flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                ) : avatarSrc ? (
                  <img src={avatarSrc} alt={user.username} className="w-24 h-24 object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {getInitials(user.username)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera size={20} className="text-white" aria-hidden />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex-1 flex flex-col gap-3 items-center sm:items-start">
              <div className="flex items-center gap-2">
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={usernameValue}
                      onChange={(e) => setUsernameValue(e.target.value)}
                      className="h-9 text-lg font-bold w-48"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveUsername();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveUsername}
                      isLoading={updateUsernameMutation.isPending}
                      aria-label="Save username"
                    >
                      <Check size={16} className="text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      aria-label="Cancel edit"
                    >
                      <X size={16} className="text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-text-base">{user.username}</h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditUsername}
                      aria-label="Edit username"
                    >
                      <Pencil size={15} className="text-text-muted" />
                    </Button>
                  </>
                )}
              </div>

              <p className="text-sm text-text-muted">{user.email}</p>
              <p className="text-xs text-text-muted">Member since {formatDate(user.createdAt)}</p>

              {updateUsernameMutation.isError && <ErrorAlert message="Failed to update username" />}
              {uploadImageMutation.isError && <ErrorAlert message="Failed to upload image" />}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border-muted flex gap-8">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-text-base">
                {postsLoading ? (
                  <span className="animate-pulse bg-bg-muted rounded w-8 h-6 inline-block" />
                ) : (
                  posts?.length ?? 0
                )}
              </span>
              <span className="text-xs text-text-muted">Posts</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold text-text-base">
                {plantsLoading ? (
                  <span className="animate-pulse bg-bg-muted rounded w-8 h-6 inline-block" />
                ) : (
                  plants?.length ?? 0
                )}
              </span>
              <span className="text-xs text-text-muted">Plants</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 border-b border-border-muted">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={cn(
                'px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === 'posts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-base',
              )}
            >
              Posts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plants')}
              className={cn(
                'px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === 'plants'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-base',
              )}
            >
              Plants
            </button>
          </div>

          {activeTab === 'posts' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreatePost(true)}
              className="mb-1 gap-1.5"
            >
              <Plus size={15} />
              New Post
            </Button>
          )}
        </div>

        {activeTab === 'posts' && (
          <section aria-label="My posts">
            {postsError ? (
              <ErrorAlert message="Failed to load posts" />
            ) : postsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : !posts || posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
                <Leaf size={40} className="opacity-40" aria-hidden />
                <p className="text-base font-medium">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <ProfilePostCard key={post.id} post={post} onClick={setSelectedPost} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'plants' && (
          <section aria-label="My plants">
            {plantsError ? (
              <ErrorAlert message="Failed to load plants" />
            ) : plantsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : !plants || plants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
                <Sprout size={40} className="opacity-40" aria-hidden />
                <p className="text-base font-medium">No plants yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plants.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedPost && (
        <PostModal
          mode="view"
          post={selectedPost}
          currentUserId={user.id}
          onClose={() => setSelectedPost(null)}
          onSuccess={() => {
            handlePostMutationSuccess();
            setSelectedPost(null);
          }}
        />
      )}

      {showCreatePost && (
        <PostModal
          mode="create"
          currentUserId={user.id}
          onClose={() => setShowCreatePost(false)}
          onSuccess={handlePostMutationSuccess}
        />
      )}
    </div>
  );
}
