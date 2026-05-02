import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Pencil, Heart, MessageCircle, ImagePlus, XCircle, MapPin } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IPostWithDetails } from '@rootshare/shared-types';
import { PostType } from '@rootshare/shared-types';
import { Button } from '@/components/ui/Button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import {
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  fetchComments,
  addComment,
  deleteComment,
  updateComment,
  uploadPostImage,
  toggleCommentLike,
} from '@/pages/Feed/feed';
import { fetchUserPlants } from '@/pages/Profile/profile';

const POST_TYPE_STYLES: Record<PostType, string> = {
  [PostType.UPDATE]: 'bg-primary/10 text-primary',
  [PostType.SWAP]: 'bg-blue-100 text-blue-700',
  [PostType.GIVEAWAY]: 'bg-orange-100 text-orange-700',
};

const POST_TYPE_LABELS: Record<PostType, string> = {
  [PostType.UPDATE]: 'Update',
  [PostType.SWAP]: 'Swap',
  [PostType.GIVEAWAY]: 'Giveaway',
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export type PostModalProps = {
  mode: 'view' | 'create';
  post?: IPostWithDetails;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function PostModal({ mode, post, currentUserId, onClose, onSuccess }: PostModalProps): JSX.Element {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isOwner = mode === 'create' || post?.user.id === currentUserId;

  const [currentPost, setCurrentPost] = useState<IPostWithDetails | null>(post ?? null);
  const [editing, setEditing] = useState(false);
  const [typeValue, setTypeValue] = useState<PostType>(post?.type ?? PostType.UPDATE);
  const [contentValue, setContentValue] = useState(post?.content ?? '');
  const [locationValue, setLocationValue] = useState(post?.location ?? '');
  const [plantId, setPlantId] = useState(post?.plant?.id ?? '');
  const [images, setImages] = useState<string[]>(post?.images ?? []);
  const [imageUploading, setImageUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const isFormMode = mode === 'create' || editing;
  const needsLocation = typeValue === PostType.SWAP || typeValue === PostType.GIVEAWAY;

  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
  } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn: () => fetchComments(post!.id),
    enabled: mode === 'view' && !!post?.id && !editing,
  });

  const { data: plants } = useQuery({
    queryKey: ['profile', 'plants'],
    queryFn: fetchUserPlants,
    enabled: isFormMode && isOwner,
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLikePost(currentPost!.id),
    onMutate: () => {
      setCurrentPost((prev) =>
        prev
          ? { ...prev, isLiked: !prev.isLiked, likesCount: prev.likesCount + (prev.isLiked ? -1 : 1) }
          : null,
      );
    },
    onSuccess: ({ liked }) => {
      setCurrentPost((prev) => (prev ? { ...prev, isLiked: liked } : null));
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'posts'] });
    },
    onError: () => {
      setCurrentPost((prev) =>
        prev
          ? { ...prev, isLiked: !prev.isLiked, likesCount: prev.likesCount + (prev.isLiked ? -1 : 1) }
          : null,
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createPost({
        type: typeValue,
        content: contentValue,
        images,
        plantId: plantId || undefined,
        location: needsLocation && locationValue.trim() ? locationValue.trim() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['garden'] });
      onSuccess();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePost(post!.id, {
        type: typeValue,
        content: contentValue,
        images,
        location: needsLocation && locationValue.trim() ? locationValue.trim() : undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['garden'] });
      setCurrentPost((prev) => ({ ...prev!, ...updated, user: prev!.user, isLiked: prev?.isLiked }));
      onSuccess();
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(post!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden'] });
      onSuccess();
      onClose();
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment(currentPost!.id, commentText),
    onSuccess: () => {
      setCommentText('');
      setCurrentPost((prev) => (prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null));
      queryClient.invalidateQueries({ queryKey: ['comments', currentPost?.id] });
      queryClient.setQueryData<IPostWithDetails[]>(['posts'], (old) =>
        old?.map((p) =>
          p.id === currentPost?.id ? { ...p, commentsCount: p.commentsCount + 1 } : p,
        ),
      );
      if (currentPost?.plant) {
        queryClient.invalidateQueries({ queryKey: ['garden'] });
      }
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: (commentId) => {
      queryClient.setQueryData<import('@rootshare/shared-types').ICommentWithUser[]>(
        ['comments', currentPost?.id],
        (old) => old?.filter((c) => c.id !== commentId) ?? [],
      );
      setCurrentPost((prev) =>
        prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null,
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', currentPost?.id] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, content),
    onSuccess: (_data, { commentId, content }) => {
      queryClient.setQueryData<import('@rootshare/shared-types').ICommentWithUser[]>(
        ['comments', currentPost?.id],
        (old) => old?.map((c) => (c.id === commentId ? { ...c, content } : c)) ?? [],
      );
      setEditingCommentId(null);
      setEditingContent('');
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onMutate: (commentId) => {
      const wasLiked = likedCommentIds.has(commentId);
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(commentId) : next.add(commentId);
        return next;
      });
      queryClient.setQueryData<import('@rootshare/shared-types').ICommentWithUser[]>(
        ['comments', currentPost?.id],
        (old) => old?.map((c) =>
          c.id === commentId
            ? { ...c, likesCount: Math.max(0, (c.likesCount ?? 0) + (wasLiked ? -1 : 1)) }
            : c
        ) ?? [],
      );
      return { wasLiked };
    },
    onSuccess: ({ liked }, commentId) => {
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        liked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
    },
    onError: (_err, commentId, context) => {
      const { wasLiked } = context as { wasLiked: boolean };
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['comments', currentPost?.id] });
    },
  });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImageUploading(true);
    try {
      const url = await uploadPostImage(file);
      setImages((prev) => [...prev, url]);
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    if (!contentValue.trim()) return;
    if (mode === 'create') {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  }

  function handleCancelEdit() {
    setEditing(false);
    setTypeValue(currentPost?.type ?? PostType.UPDATE);
    setContentValue(currentPost?.content ?? '');
    setLocationValue(currentPost?.location ?? '');
    setPlantId(currentPost?.plant?.id ?? '');
    setImages(currentPost?.images ?? []);
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    commentMutation.mutate();
  }

  function openEdit() {
    setTypeValue(currentPost!.type);
    setContentValue(currentPost!.content);
    setLocationValue(currentPost?.location ?? '');
    setPlantId(currentPost?.plant?.id ?? '');
    setImages(currentPost!.images);
    setEditing(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-card border border-border-default rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-muted flex-shrink-0">
          <h2 className="text-base font-semibold text-text-base">
            {mode === 'create' ? 'New Post' : editing ? 'Edit Post' : 'Post'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-base transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {isFormMode ? (
            <>
              <div className="flex gap-2">
                {Object.values(PostType).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeValue(type)}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-medium rounded-full border transition-colors',
                      typeValue === type
                        ? cn(POST_TYPE_STYLES[type], 'border-transparent')
                        : 'border-border-default text-text-muted hover:text-text-base',
                    )}
                  >
                    {POST_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {plants && plants.length > 0 && (
                <select
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-full text-sm border border-border-default rounded-lg px-3 py-2 bg-bg-main text-text-base focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No plant linked</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                      {plant.species ? ` · ${plant.species}` : ''}
                    </option>
                  ))}
                </select>
              )}

              <textarea
                value={contentValue}
                onChange={(e) => setContentValue(e.target.value)}
                placeholder="What's growing on?"
                rows={4}
                className="w-full text-sm border border-border-default rounded-lg px-3 py-2 bg-bg-main text-text-base resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted"
                autoFocus
              />

              {needsLocation && (
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden />
                  <input
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="Location (city, neighborhood…)"
                    className="w-full text-sm border border-border-default rounded-lg pl-8 pr-3 py-2 bg-bg-main text-text-base focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted"
                  />
                </div>
              )}

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <XCircle size={18} className="text-white drop-shadow" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading || images.length >= 10}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-base transition-colors disabled:opacity-40"
                >
                  {imageUploading ? <Spinner size="sm" /> : <ImagePlus size={16} />}
                  <span>{imageUploading ? 'Uploading…' : 'Add photo'}</span>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />

                <div className="flex gap-2">
                  {editing && (
                    <Button variant="ghost" onClick={handleCancelEdit} disabled={updateMutation.isPending}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    disabled={!contentValue.trim() || imageUploading}
                  >
                    {mode === 'create' ? 'Post' : 'Save'}
                  </Button>
                </div>
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <ErrorAlert message="Failed to save post" />
              )}
            </>
          ) : currentPost ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { onClose(); navigate(`/profile/${currentPost.user.id}`); }}
                  className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm select-none">
                    {currentPost.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-text-base">
                      {currentPost.user.username}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {new Date(currentPost.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </button>
                <span
                  className={cn(
                    'text-xs font-medium px-2.5 py-0.5 rounded-full',
                    POST_TYPE_STYLES[currentPost.type],
                  )}
                >
                  {POST_TYPE_LABELS[currentPost.type]}
                </span>
              </div>

              {currentPost.plant && (
                <span className="inline-block text-xs text-text-muted bg-bg-subtle border border-border-muted px-2.5 py-0.5 rounded-full self-start">
                  {currentPost.plant.name}
                  {currentPost.plant.species && <span> · {currentPost.plant.species}</span>}
                </span>
              )}

              {currentPost.location && (
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full self-start">
                  <MapPin size={11} aria-hidden />
                  {currentPost.location}
                </span>
              )}

              <p className="text-sm text-text-base leading-relaxed">{currentPost.content}</p>

              {currentPost.images.length > 0 && (
                <div
                  className={cn(
                    'grid gap-2 rounded-md overflow-hidden',
                    currentPost.images.length === 1 && 'grid-cols-1',
                    currentPost.images.length === 2 && 'grid-cols-2',
                    currentPost.images.length >= 3 && 'grid-cols-3',
                  )}
                >
                  {currentPost.images.map((src, idx) => (
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

              <div className="flex items-center justify-between pt-1 border-t border-border-muted">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                    className={cn(
                      'flex items-center gap-1.5 text-sm transition-all duration-150 active:scale-90',
                      currentPost.isLiked ? 'text-red-500' : 'text-text-muted hover:text-red-400',
                    )}
                    aria-label={currentPost.isLiked ? 'Unlike' : 'Like'}
                    aria-pressed={currentPost.isLiked}
                  >
                    <Heart
                      size={16}
                      className={cn('transition-all duration-200', currentPost.isLiked && 'fill-red-500 scale-110')}
                      aria-hidden
                    />
                    <span>{currentPost.likesCount}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-sm text-text-muted">
                    <MessageCircle size={16} aria-hidden />
                    <span>{currentPost.commentsCount}</span>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    {confirmDelete ? (
                      <>
                        <span className="text-xs text-text-muted">Delete this post?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate()}
                          isLoading={deleteMutation.isPending}
                        >
                          Yes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                          No
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" onClick={openEdit} aria-label="Edit post">
                          <Pencil size={15} className="text-text-muted" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setConfirmDelete(true)}
                          aria-label="Delete post"
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {deleteMutation.isError && <ErrorAlert message="Failed to delete post" />}

              <div className="border-t border-border-muted pt-3 flex flex-col gap-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Comments
                </span>

                {commentsLoading ? (
                  <div className="flex flex-col gap-2">
                    <div className="animate-pulse bg-bg-muted rounded h-8" />
                    <div className="animate-pulse bg-bg-muted rounded h-8" />
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {comments.map((comment) => {
                      const isCommentOwner = comment.user.id === currentUserId;
                      const canDelete = isCommentOwner || currentPost?.user.id === currentUserId;
                      const isEditingThis = editingCommentId === comment.id;
                      return (
                        <div key={comment.id} className="flex gap-2.5 group">
                          <button
                            type="button"
                            onClick={() => { onClose(); navigate(`/profile/${comment.user.id}`); }}
                            className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold select-none hover:opacity-80 transition-opacity"
                          >
                            {comment.user.username.charAt(0).toUpperCase()}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => { onClose(); navigate(`/profile/${comment.user.id}`); }}
                                className="text-xs font-semibold text-text-base hover:underline"
                              >
                                {comment.user.username}
                              </button>
                              <span className="text-xs text-text-muted">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            {isEditingThis ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  rows={2}
                                  autoFocus
                                  className="w-full text-sm border border-border-default rounded-lg px-3 py-1.5 bg-bg-main text-text-base resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (editingContent.trim()) {
                                        updateCommentMutation.mutate({ commentId: comment.id, content: editingContent.trim() });
                                      }
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingCommentId(null);
                                      setEditingContent('');
                                    }
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (editingContent.trim()) {
                                        updateCommentMutation.mutate({ commentId: comment.id, content: editingContent.trim() });
                                      }
                                    }}
                                    isLoading={updateCommentMutation.isPending}
                                    disabled={!editingContent.trim()}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setEditingCommentId(null); setEditingContent(''); }}
                                    disabled={updateCommentMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-text-base leading-snug">{comment.content}</p>
                                <button
                                  type="button"
                                  onClick={() => likeCommentMutation.mutate(comment.id)}
                                  className={cn(
                                    'flex items-center gap-1 mt-1 transition-colors active:scale-90',
                                    likedCommentIds.has(comment.id)
                                      ? 'text-red-500'
                                      : 'text-text-muted hover:text-red-400',
                                  )}
                                  aria-label={likedCommentIds.has(comment.id) ? 'Unlike comment' : 'Like comment'}
                                >
                                  <Heart
                                    size={12}
                                    className={cn(likedCommentIds.has(comment.id) && 'fill-red-500')}
                                  />
                                  {(comment.likesCount ?? 0) > 0 && (
                                    <span className="text-xs">{comment.likesCount}</span>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                          {!isEditingThis && (
                            <div className="flex-shrink-0 flex gap-1 self-start mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isCommentOwner && (
                                <button
                                  type="button"
                                  onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}
                                  className="text-text-muted hover:text-primary transition-colors"
                                  aria-label="Edit comment"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  disabled={deleteCommentMutation.isPending}
                                  className="text-text-muted hover:text-destructive transition-colors"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : commentsError ? (
                  <ErrorAlert message="Failed to load comments" />
                ) : (
                  <p className="text-sm text-text-muted">No comments yet</p>
                )}

                <div className="flex gap-2 items-end">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    rows={2}
                    className="flex-1 text-sm border border-border-default rounded-lg px-3 py-2 bg-bg-main text-text-base resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    isLoading={commentMutation.isPending}
                  >
                    Post
                  </Button>
                </div>

                {commentMutation.isError && <ErrorAlert message="Failed to post comment" />}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
