"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProfileCardProps {
  profile: {
    profileId: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    bgImageUrl?: string | null;
    status: string | null;
    statusType: string | null;
    blockCount: number;
    viewCount: number;
    likeCount: number;
  };
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={linkRef}
      href={`/@${profile.username}`}
      prefetch={true}
      className="group relative aspect-[9/16] md:aspect-[3/4] overflow-hidden bg-zinc-100 rounded-sm md:rounded-md hover:opacity-90 transition-opacity flex flex-col"
    >
      <div className="relative flex-1 overflow-hidden">
            {/* Cover Image - Primary Focus */}
        {profile.coverImageUrl || profile.bgImageUrl ? (
          <Image
            src={profile.coverImageUrl || profile.bgImageUrl!}
            alt={profile.displayName || profile.username}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="relative h-16 w-16 md:h-20 md:w-20 mx-auto mb-3 overflow-hidden rounded-full bg-white/20 border-2 border-white/30">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName || profile.username}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 64px, 80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/20 text-2xl md:text-3xl font-bold text-white">
                    {(profile.displayName || profile.username)[0].toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-white font-semibold text-sm md:text-base whitespace-normal w-full px-2 mx-auto">
                {profile.displayName || profile.username}
              </p>
            </div>
          </div>
        )}

        {/* Overlay with Profile Info */}
        {/* Always visible - touch devices (iPad) don't have hover, so overlay is always shown */}
        <div
          className="absolute inset-0 transition-opacity duration-200 flex flex-col items-center justify-center p-4 text-white opacity-100"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)'
          }}
        >
          <div className="text-center mt-auto mb-4">
            {/* Avatar */}
            <div className="relative h-16 w-16 md:h-20 md:w-20 mx-auto mb-3 overflow-hidden rounded-full border-2 border-white">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.username}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 64px, 80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl md:text-2xl font-bold text-white">
                  {(profile.displayName || profile.username)[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Display Name - Natural wrapping, only wraps when necessary */}
            <h3 className="text-base md:text-lg font-bold mb-1 whitespace-normal w-full px-2 mx-auto leading-tight">
              {profile.displayName || profile.username}
            </h3>

            {/* Username */}
            <p className="text-xs md:text-sm text-white/80 mb-2">@{profile.username}</p>

            {/* Status */}
            {profile.status && (
              <div className="mb-2">
                {profile.statusType === "image" ? (
                  <div className="relative h-8 w-8 md:h-10 md:w-10 mx-auto rounded-full overflow-hidden border-2 border-white">
                    <Image
                      src={profile.status}
                      alt="Status"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 32px, 40px"
                    />
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white border border-white/30">
                    {profile.status}
                  </span>
                )}
              </div>
            )}

            {/* Block Count */}
            <div className="flex items-center justify-center gap-1 text-xs md:text-sm text-white/90">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>{profile.blockCount} konten</span>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Section: Bio Description, View, and Like - Always Visible */}
      <div className="bg-white p-2 md:p-3 border-t border-zinc-100">
        {/* Bio Description - Fixed height for mobile & tablet to ensure consistency */}
        <div className="h-[2.5rem] mb-2">
          {profile.bio ? (
            <p className="text-xs md:text-sm font-medium text-zinc-900 line-clamp-2">
              {profile.bio}
            </p>
          ) : (
            <p className="text-xs md:text-sm font-medium text-zinc-900 opacity-0 select-none pointer-events-none">
              &nbsp;
            </p>
          )}
        </div>

        {/* View and Like Count */}
        <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">
              {profile.viewCount >= 1000
                ? `${(profile.viewCount / 1000).toFixed(1)}k`
                : profile.viewCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-medium">
              {profile.likeCount >= 1000
                ? `${(profile.likeCount / 1000).toFixed(1)}k`
                : profile.likeCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

