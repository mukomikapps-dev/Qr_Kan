"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileCard from "./ProfileCard";

interface Profile {
  profileId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  status: string | null;
  statusType: string | null;
  blockCount: number;
  viewCount: number;
  likeCount: number;
}

interface InfiniteScrollExploreProps {
  initialProfiles: Profile[];
  category?: string | null;
}

export default function InfiniteScrollExplore({
  initialProfiles,
  category,
}: InfiniteScrollExploreProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProfiles.length === 10);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
      const apiResponse = await fetch(`/api/explore?page=${nextPage}${categoryParam}`);
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data.profiles && data.profiles.length > 0) {
          setProfiles((prev) => [...prev, ...data.profiles]);
          setPage(nextPage);
          setHasMore(data.hasMore);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more profiles:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-3">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.profileId}
            profile={{
              profileId: profile.profileId,
              username: profile.username,
              displayName: profile.displayName || profile.username,
              bio: profile.bio,
              avatarUrl: profile.avatarUrl,
              coverImageUrl: profile.coverImageUrl,
              status: profile.status,
              statusType: profile.statusType,
              blockCount: profile.blockCount,
              viewCount: profile.viewCount || 0,
              likeCount: profile.likeCount || 0,
            }}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600"></div>
            <span className="text-sm">Memuat...</span>
          </div>
        </div>
      )}

      {/* Observer target for infinite scroll */}
      <div ref={observerTarget} className="h-10" />

      {/* End message */}
      {!hasMore && profiles.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500">Semua profil telah dimuat</p>
        </div>
      )}
    </>
  );
}
