
interface PriceRankIndicatorProps {
  priceRank: number;
}

export function PriceRankIndicator({ priceRank }: PriceRankIndicatorProps) {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Market Position</h4>
      <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${priceRank}%` }}
        />
        <div 
          className="absolute top-0 w-2 h-4 bg-black" 
          style={{ 
            left: `${Math.max(Math.min(priceRank, 98), 2)}%`, 
            transform: 'translateX(-50%)' 
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>Lowest Price</span>
        <span>Highest Price</span>
      </div>
      <p className="text-sm mt-2">
        This rental is priced higher than {priceRank}% of similar rentals in the area.
      </p>
    </div>
  );
}
