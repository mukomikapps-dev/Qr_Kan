export default function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 animate-pulse">
      {/* Header Skeleton */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-zinc-200 rounded"></div>
            <div className="h-7 w-24 bg-zinc-200 rounded"></div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="h-5 w-16 bg-zinc-200 rounded"></div>
            <div className="h-5 w-12 bg-zinc-200 rounded"></div>
            <div className="h-5 w-16 bg-zinc-200 rounded"></div>
            <div className="h-10 w-24 bg-zinc-200 rounded-full"></div>
          </div>
          <div className="md:hidden">
            <div className="h-8 w-16 bg-zinc-200 rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div>
            {/* Badge Skeleton */}
            <div className="h-6 w-64 bg-zinc-200 rounded-full mb-6"></div>
            
            {/* Title Skeleton */}
            <div className="space-y-4 mb-6">
              <div className="h-12 w-full bg-zinc-200 rounded"></div>
              <div className="h-12 w-4/5 bg-zinc-200 rounded"></div>
            </div>
            
            {/* Description Skeleton */}
            <div className="space-y-2 mb-8">
              <div className="h-6 w-full bg-zinc-200 rounded"></div>
              <div className="h-6 w-5/6 bg-zinc-200 rounded"></div>
            </div>
            
            {/* Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="h-14 w-48 bg-zinc-200 rounded-full"></div>
              <div className="h-14 w-40 bg-zinc-200 rounded-full"></div>
            </div>
            
            {/* Features Skeleton */}
            <div className="flex items-center gap-6">
              <div className="h-4 w-32 bg-zinc-200 rounded"></div>
              <div className="h-4 w-36 bg-zinc-200 rounded"></div>
            </div>
          </div>
          
          {/* Hero Image Skeleton */}
          <div className="relative">
            <div className="rounded-2xl border-8 border-zinc-900 bg-white shadow-2xl overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
              </div>
              <div className="p-8 bg-gradient-to-br from-emerald-50 to-white">
                <div className="h-64 w-full bg-zinc-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



