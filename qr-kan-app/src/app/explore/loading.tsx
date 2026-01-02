export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
      {/* Header Skeleton */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse"></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Title Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-zinc-200 rounded mb-4 animate-pulse mx-auto"></div>
          <div className="h-5 w-96 bg-zinc-200 rounded animate-pulse mx-auto"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 lg:gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-[9/16] sm:aspect-[3/4] bg-zinc-200 rounded-sm sm:rounded-md animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}



