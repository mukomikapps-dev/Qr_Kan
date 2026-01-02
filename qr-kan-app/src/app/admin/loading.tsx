export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse">
      {/* Header Skeleton */}
      <header className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-700"></div>
            <div className="h-6 w-32 bg-zinc-700 rounded"></div>
          </div>
          <div className="h-10 w-24 bg-zinc-700 rounded-lg"></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Title Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-zinc-700 rounded mb-2"></div>
          <div className="h-5 w-64 bg-zinc-700 rounded"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6"
            >
              <div className="h-5 w-24 bg-zinc-700 rounded mb-4"></div>
              <div className="h-10 w-32 bg-zinc-700 rounded mb-2"></div>
              <div className="h-4 w-16 bg-zinc-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Recent Users Table Skeleton */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
          <div className="h-7 w-40 bg-zinc-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-zinc-700">
                <div className="h-10 w-10 rounded-full bg-zinc-700"></div>
                <div className="flex-1">
                  <div className="h-5 w-48 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-zinc-700 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-zinc-700 rounded"></div>
                <div className="h-8 w-20 bg-zinc-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



