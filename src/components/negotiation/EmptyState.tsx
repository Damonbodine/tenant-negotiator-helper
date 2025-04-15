
import { Building } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-blue-400/20 rounded-full" />
        <Building className="h-16 w-16 text-blue-400 relative animate-pulse" />
      </div>
      <h3 className="font-medium text-xl mt-6 mb-2 gradient-heading">Enter Property Details</h3>
      <p className="text-white/70 max-w-md">
        Fill out the property information to see how the price compares to similar rentals in the area.
      </p>
    </div>
  );
}
