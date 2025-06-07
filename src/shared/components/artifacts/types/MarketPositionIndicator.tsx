import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MarketPositionIndicatorData, VisualArtifact } from '@/shared/types/artifacts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';

interface MarketPositionIndicatorProps {
  data: MarketPositionIndicatorData;
  artifact: VisualArtifact;
}

const STATUS_CONFIG = {
  excellent_deal: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: CheckCircle,
    label: 'Excellent Deal'
  },
  good_value: {
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: TrendingDown,
    label: 'Good Value'
  },
  market_rate: {
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    icon: Minus,
    label: 'Market Rate'
  },
  above_market: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    icon: TrendingUp,
    label: 'Above Market'
  },
  overpriced: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: AlertCircle,
    label: 'Overpriced'
  }
};

const MarketPositionIndicator: React.FC<MarketPositionIndicatorProps> = ({ data }) => {
  const config = STATUS_CONFIG[data.status];
  const Icon = config.icon;
  
  const difference = data.currentRent - data.marketMedian;
  const differencePercent = ((difference / data.marketMedian) * 100);
  
  return (
    <Card className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        </div>
        <div>
          <h3 className="font-semibold">Market Position</h3>
          <p className="text-sm text-muted-foreground">
            How your rent compares to market
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Badge 
          variant="secondary" 
          className={`${config.color} text-white px-3 py-1`}
        >
          {config.label}
        </Badge>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Confidence</div>
          <div className="font-medium">{Math.round(data.confidence * 100)}%</div>
        </div>
      </div>

      {/* Position Visualization */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Market Position</span>
          <span className="font-medium">{data.percentile}th percentile</span>
        </div>
        
        <div className="relative">
          <Progress value={data.percentile} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Bottom 25%</span>
            <span>Median</span>
            <span>Top 25%</span>
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold">${data.currentRent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Your Rent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">${data.marketMedian.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Market Median</div>
        </div>
      </div>

      {/* Difference Analysis */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Difference from Market</span>
          <span className={`font-medium ${difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {difference > 0 ? '+' : ''}${difference.toLocaleString()} 
            ({differencePercent > 0 ? '+' : ''}{differencePercent.toFixed(1)}%)
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {data.message}
        </div>
      </div>

      {/* Negotiation Insights */}
      {data.status === 'above_market' || data.status === 'overpriced' ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Negotiation Opportunity</div>
              <div>
                Your rent is above market rate. Consider negotiating for a reduction 
                of ${Math.abs(difference).toLocaleString()} to align with market median.
              </div>
            </div>
          </div>
        </div>
      ) : data.status === 'excellent_deal' ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <div className="font-medium mb-1">Great Deal!</div>
              <div>
                You're getting excellent value. Consider staying put or negotiate for 
                improvements rather than rent reduction.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};

export default MarketPositionIndicator;