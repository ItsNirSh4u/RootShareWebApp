import { Heart, MessageCircle } from 'lucide-react';
import type { IPostWithDetails } from '@rootshare/shared-types';
import { PostType } from '@rootshare/shared-types';
import { cn } from '@/lib/utils';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${diffWeeks}wk ago`;
}

const POST_TYPE_BADGE: Record<PostType, { label: string; className: string }> = {
  [PostType.UPDATE]: {
    label: 'Update',
    className: 'bg-primary/10 text-primary',
  },
  [PostType.SWAP]: {
    label: 'Swap',
    className: 'bg-blue-100 text-blue-700',
  },
  [PostType.GIVEAWAY]: {
    label: 'Giveaway',
    className: 'bg-orange-100 text-orange-700',
  },
};

interface PostCardProps {
  post: IPostWithDetails;
  onLike?: (postId: string) => void;
}

export function PostCard({ post, onLike }: PostCardProps): JSX.Element {
  const badge = POST_TYPE_BADGE[post.type];
  const avatarLetter = post.user.username.charAt(0).toUpperCase();
  const visibleImages = post.images.slice(0, 3);

  return (
    <article className="bg-bg-card rounded-lg shadow-soft-md border border-border-default p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm select-none"
            aria-label={post.user.username}
          >
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-text-base truncate">
              {post.user.username}
            </span>
            <span className="block text-xs text-text-muted">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span
            className={cn(
              'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full',
              badge.className,
            )}
          >
            {badge.label}
          </span>

          {post.plant && (
            <span className="inline-block text-xs text-text-subtle bg-bg-subtle border border-border-muted px-2.5 py-0.5 rounded-full max-w-[180px] truncate">
              {post.plant.name}
              {post.plant.species && (
                <span className="text-text-muted"> &middot; {post.plant.species}</span>
              )}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-text-base leading-relaxed line-clamp-4">{post.content}</p>

      {visibleImages.length > 0 && (
        <div
          className={cn(
            'grid gap-2 rounded-md overflow-hidden',
            visibleImages.length === 1 && 'grid-cols-1',
            visibleImages.length === 2 && 'grid-cols-2',
            visibleImages.length >= 3 && 'grid-cols-3',
          )}
        >
          {visibleImages.map((src, idx) => (
            <div key={idx} className="aspect-square bg-bg-subtle">
              <img
                src={src}
                alt={`Post image ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-5 pt-1 border-t border-border-muted">
        <button
          type="button"
          onClick={() => onLike?.(post.id)}
          disabled={!onLike}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            post.isLiked
              ? 'text-red-500'
              : 'text-text-muted hover:text-red-400',
            !onLike && 'cursor-default',
          )}
          aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
          aria-pressed={post.isLiked}
        >
          <Heart
            size={16}
            className={cn(post.isLiked && 'fill-red-500')}
            aria-hidden
          />
          <span>{post.likesCount}</span>
        </button>

        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <MessageCircle size={16} aria-hidden />
          <span>{post.commentsCount}</span>
        </div>
      </div>
    </article>
  );
}
