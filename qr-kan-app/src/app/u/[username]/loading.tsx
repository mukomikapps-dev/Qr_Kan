export default function UserProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white animate-pulse">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 flex items-center gap-3 py-3 px-6 mb-6 bg-white/80 backdrop-blur-sm">
        <div className="h-12 w-12 rounded-full bg-zinc-200"></div>
        <div className="flex-1">
          <div className="h-5 w-32 bg-zinc-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-zinc-200 rounded"></div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-lg px-6 py-10">
        {/* Cover Image Skeleton */}
        <div className="h-48 w-full bg-zinc-200 rounded-xl mb-6"></div>

        {/* Avatar Skeleton */}
        <div className="flex justify-center -mt-16 mb-4">
          <div className="h-32 w-32 rounded-full bg-zinc-200 border-4 border-white"></div>
        </div>

        {/* Name & Bio Skeleton */}
        <div className="text-center mb-6">
          <div className="h-7 w-48 bg-zinc-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-32 bg-zinc-200 rounded mx-auto mb-4"></div>
          <div className="h-4 w-full max-w-md bg-zinc-200 rounded mx-auto mb-2"></div>
          <div className="h-4 w-3/4 bg-zinc-200 rounded mx-auto"></div>
        </div>

        {/* Blocks Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 w-full bg-zinc-200 rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}



