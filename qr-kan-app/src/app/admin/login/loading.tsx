export default function AdminLoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl p-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-700 mb-4"></div>
            <div className="h-8 w-40 bg-zinc-700 rounded mx-auto mb-2"></div>
            <div className="h-4 w-48 bg-zinc-700 rounded mx-auto"></div>
          </div>

          {/* Security Notice Skeleton */}
          <div className="mb-6 p-4 rounded-lg bg-zinc-700/20 border border-zinc-600">
            <div className="h-4 w-full bg-zinc-700 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-zinc-700 rounded"></div>
          </div>

          {/* Form Skeleton */}
          <div className="space-y-4">
            <div>
              <div className="h-4 w-16 bg-zinc-700 rounded mb-2"></div>
              <div className="h-12 w-full bg-zinc-700 rounded-lg"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-zinc-700 rounded mb-2"></div>
              <div className="h-12 w-full bg-zinc-700 rounded-lg"></div>
            </div>
            <div className="h-12 w-full bg-zinc-700 rounded-lg"></div>
          </div>

          {/* Footer Skeleton */}
          <div className="mt-6 text-center">
            <div className="h-3 w-48 bg-zinc-700 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}



