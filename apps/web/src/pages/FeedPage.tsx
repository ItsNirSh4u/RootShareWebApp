import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Leaf } from 'lucide-react';
import { PostType } from '@rootshare/shared-types';
import { ErrorAlert } from '@/components/ui';
import { FeaturedPlantsCarousel, FeedFilters, PostCard } from '@/components/feed';
import { fetchPosts, fetchFeaturedPlants, toggleLikePost } from '@/pages/Feed/feed';

type ActiveType = PostType | 'all';

function PostSkeleton(): JSX.Element {
  return <div className="animate-pulse bg-bg-muted rounded-lg h-48" />;
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
      <Leaf size={40} className="opacity-40" aria-hidden />
      <p className="text-base font-medium">No posts found</p>
    </div>
  );
}

export function FeedPage(): JSX.Element {
  const queryClient = useQueryClient();

  const [activeType, setActiveType] = useState<ActiveType>('all');
  const [search, setSearch] = useState('');

  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const { data: featuredPlants, isLoading: plantsLoading } = useQuery({
    queryKey: ['plants', 'featured'],
    queryFn: fetchFeaturedPlants,
  });

  const likeMutation = useMutation({
    mutationFn: toggleLikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    let result = posts;

    if (activeType !== 'all') {
      result = result.filter((post) => post.type === activeType);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (post) =>
          post.content.toLowerCase().includes(query) ||
          post.user.username.toLowerCase().includes(query),
      );
    }

    return result;
  }, [posts, activeType, search]);

  return (
    <div className="min-h-full bg-bg-main">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6">
        <header className="flex items-center gap-2.5 mb-6">
          <Leaf size={26} className="text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-text-base">Community Feed</h1>
        </header>

        <div className="flex flex-col gap-5">
          <FeaturedPlantsCarousel
            plants={featuredPlants ?? []}
            isLoading={plantsLoading}
          />

          <FeedFilters
            activeType={activeType}
            onTypeChange={setActiveType}
            search={search}
            onSearchChange={setSearch}
          />

          <section aria-label="Posts" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {postsError ? (
              <div className="col-span-full">
                <ErrorAlert message="Failed to load posts" />
              </div>
            ) : postsLoading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : filteredPosts.length === 0 ? (
              <div className="col-span-full">
                <EmptyState />
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onLike={(id) => likeMutation.mutate(id)} />
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
