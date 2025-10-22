export function CampaignCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
      
      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      
      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
      
      {/* Progress bar skeleton */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2"></div>
      </div>
      
      {/* Milestone progress skeleton */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-3 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2"></div>
      </div>
      
      {/* Founder info skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
          <div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
    </div>
  )
}





