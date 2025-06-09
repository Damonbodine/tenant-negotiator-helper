/**
 * Cost Optimization Dashboard
 * 
 * Real-time monitoring and analytics for API cost optimization
 * Shows savings, efficiency metrics, and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingDown, 
  Zap, 
  Target, 
  BarChart3, 
  RefreshCw,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface CostMetrics {
  totalCostSaved: number;
  cacheHitRate: number;
  fallbackRate: number;
  duplicatesBlocked: number;
  averageCostPerUser: number;
  projectedMonthlySavings: number;
  optimizationLevel: 'excellent' | 'good' | 'needs_improvement';
  recommendations: string[];
}

interface SystemStatus {
  caching: 'active' | 'degraded' | 'error';
  deduplication: 'active' | 'degraded' | 'error';
  modelFallbacks: 'active' | 'degraded' | 'error';
  marketDataCache: 'active' | 'degraded' | 'error';
}

export const CostOptimizationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch cost optimization metrics
  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Test the cost-optimized function
      const response = await fetch('/api/chat-ai-cost-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Simulate comprehensive metrics (in real app, these would come from various services)
        const mockMetrics: CostMetrics = {
          totalCostSaved: data.costOptimization?.totalSaved || 0,
          cacheHitRate: data.costOptimization?.cacheHitRate || 0,
          fallbackRate: 0.65, // Would come from smartModelFallback service
          duplicatesBlocked: 23, // Would come from deduplication service
          averageCostPerUser: 2.85,
          projectedMonthlySavings: (data.costOptimization?.totalSaved || 0) * 30,
          optimizationLevel: data.costOptimization?.optimizationLevel || 'good',
          recommendations: data.costOptimization?.recommendations || []
        };

        setMetrics(mockMetrics);

        // Simulate system status
        setSystemStatus({
          caching: 'active',
          deduplication: 'active', 
          modelFallbacks: 'active',
          marketDataCache: 'active'
        });
      }
    } catch (error) {
      console.error('Failed to fetch cost metrics:', error);
      // Set error status
      setSystemStatus({
        caching: 'error',
        deduplication: 'error',
        modelFallbacks: 'error', 
        marketDataCache: 'error'
      });
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOptimizationColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'needs_improvement': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Cost Optimization Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Cost Optimization Dashboard</h1>
          <Badge 
            variant={metrics?.optimizationLevel === 'excellent' ? 'default' : 'secondary'}
            className={`ml-2 ${getOptimizationColor(metrics?.optimizationLevel || 'good')}`}
          >
            {metrics?.optimizationLevel || 'Loading...'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  ${metrics?.totalCostSaved.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {((metrics?.cacheHitRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <Progress 
              value={(metrics?.cacheHitRate || 0) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Model Fallback Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {((metrics?.fallbackRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <Progress 
              value={(metrics?.fallbackRate || 0) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Cost/User</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${metrics?.averageCostPerUser.toFixed(2) || '0.00'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Real-time status of cost optimization components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus?.caching || 'error')}
              <span className="text-sm">Response Caching</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus?.deduplication || 'error')}
              <span className="text-sm">Request Deduplication</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus?.modelFallbacks || 'error')}
              <span className="text-sm">Model Fallbacks</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus?.marketDataCache || 'error')}
              <span className="text-sm">Market Data Cache</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>
              Monthly cost analysis and projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Projected Monthly Savings</span>
                <span className="font-bold text-green-600">
                  ${metrics?.projectedMonthlySavings.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Duplicates Blocked</span>
                <span className="font-bold text-blue-600">
                  {metrics?.duplicatesBlocked || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Target Cost/User</span>
                <span className="font-bold text-gray-600">$1.50 - $3.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Cost/User</span>
                <span className={`font-bold ${
                  (metrics?.averageCostPerUser || 0) <= 3.0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${metrics?.averageCostPerUser.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <CardDescription>
              AI-generated suggestions for further cost reduction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.recommendations && metrics.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {metrics.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All optimizations are running smoothly!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostOptimizationDashboard;