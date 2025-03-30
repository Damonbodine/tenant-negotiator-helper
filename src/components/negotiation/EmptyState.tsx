
import { Home } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
      <Home className="h-12 w-12 text-slate-300 mb-4" />
      <h3 className="font-medium text-lg">Enter Property Details</h3>
      <p className="text-muted-foreground mt-2">
        Fill out the property information to see how the price compares to similar rentals in the area.
      </p>
    </div>
  );
}
