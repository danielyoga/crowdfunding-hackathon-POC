export function CampaignCardSkeleton() {
  return (
    <div className="card">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 shimmer"></div>
      
      {/* Category and date skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-16 bg-gray-200 rounded-full shimmer"></div>
        <div className="h-4 w-20 bg-gray-200 rounded shimmer"></div>
      </div>
      
      {/* Title skeleton */}
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 shimmer"></div>
      
      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 rounded shimmer"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded shimmer"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded shimmer"></div>
      </div>
      
      {/* Funding progress skeleton */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-24 bg-gray-200 rounded shimmer"></div>
          <div className="h-4 w-12 bg-gray-200 rounded shimmer"></div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded shimmer"></div>
        <div className="flex justify-between items-center mt-1">
          <div className="h-3 w-20 bg-gray-200 rounded shimmer"></div>
          <div className="h-3 w-16 bg-gray-200 rounded shimmer"></div>
        </div>
      </div>
      
      {/* Milestone progress skeleton */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 w-28 bg-gray-200 rounded shimmer"></div>
          <div className="h-4 w-16 bg-gray-200 rounded shimmer"></div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded shimmer"></div>
      </div>
      
      {/* Founder info skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 shimmer"></div>
          <div>
            <div className="h-4 w-12 bg-gray-200 rounded mb-1 shimmer"></div>
            <div className="h-3 w-16 bg-gray-200 rounded shimmer"></div>
          </div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full shimmer"></div>
      </div>
    </div>
  );
}
