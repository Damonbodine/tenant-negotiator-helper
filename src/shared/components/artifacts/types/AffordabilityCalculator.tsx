import React, { useState, useMemo } from 'react';
import { Card } from '@/shared/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AffordabilityCalculatorData, VisualArtifact } from '@/shared/types/artifacts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Target,
  PiggyBank
} from 'lucide-react';

interface AffordabilityCalculatorProps {
  data: AffordabilityCalculatorData;
  artifact: VisualArtifact;
}

const AffordabilityCalculator: React.FC<AffordabilityCalculatorProps> = ({ data: initialData }) => {
  const [income, setIncome] = useState(initialData.income);
  const [currentRent, setCurrentRent] = useState(initialData.currentRent);
  const [targetRent, setTargetRent] = useState(currentRent * 0.9); // 10% reduction default

  // Calculations
  const calculations = useMemo(() => {
    const monthlyIncome = income / 12;
    const currentPercentage = (currentRent / monthlyIncome) * 100;
    const targetPercentage = (targetRent / monthlyIncome) * 100;
    const recommendedMax = monthlyIncome * 0.3; // 30% rule
    const monthlySavings = currentRent - targetRent;
    const annualSavings = monthlySavings * 12;
    
    // Affordability zones
    const getZone = (percentage: number) => {
      if (percentage <= 30) return { name: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
      if (percentage <= 40) return { name: 'Manageable', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' };
      return { name: 'Strained', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' };
    };

    return {
      monthlyIncome,
      currentPercentage,
      targetPercentage,
      recommendedMax,
      monthlySavings,
      annualSavings,
      currentZone: getZone(currentPercentage),
      targetZone: getZone(targetPercentage),
      overBudget: currentRent > recommendedMax,
      savingsImpact: annualSavings > 0
    };
  }, [income, currentRent, targetRent]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`;

  return (
    <div className="space-y-4 w-full max-w-none overflow-x-auto">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-50">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">Affordability Calculator</h3>
            <p className="text-sm text-muted-foreground">
              Analyze your rent affordability and negotiation opportunities
            </p>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`${calculations.currentZone.color} text-white px-3 py-1`}
          >
            {calculations.currentZone.name} Financial Position
          </Badge>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Rent Ratio</div>
            <div className="font-bold text-lg">{formatPercentage(calculations.currentPercentage)}</div>
          </div>
        </div>
      </Card>

      {/* Input Controls */}
      <Card className="p-4">
        <h4 className="font-medium mb-4">Adjust Your Situation</h4>
        
        <div className="space-y-6">
          {/* Annual Income */}
          <div className="space-y-2">
            <Label htmlFor="income">Annual Income</Label>
            <div className="flex items-center gap-4">
              <Input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-32"
              />
              <Slider
                value={[income]}
                onValueChange={([value]) => setIncome(value)}
                max={200000}
                min={30000}
                step={5000}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-20">
                {formatCurrency(income)}
              </span>
            </div>
          </div>

          {/* Current Rent */}
          <div className="space-y-2">
            <Label htmlFor="current-rent">Current Monthly Rent</Label>
            <div className="flex items-center gap-4">
              <Input
                id="current-rent"
                type="number"
                value={currentRent}
                onChange={(e) => setCurrentRent(Number(e.target.value))}
                className="w-32"
              />
              <Slider
                value={[currentRent]}
                onValueChange={([value]) => setCurrentRent(value)}
                max={8000}
                min={500}
                step={50}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-20">
                {formatCurrency(currentRent)}
              </span>
            </div>
          </div>

          {/* Target Rent */}
          <div className="space-y-2">
            <Label htmlFor="target-rent">Target Monthly Rent</Label>
            <div className="flex items-center gap-4">
              <Input
                id="target-rent"
                type="number"
                value={targetRent}
                onChange={(e) => setTargetRent(Number(e.target.value))}
                className="w-32"
              />
              <Slider
                value={[targetRent]}
                onValueChange={([value]) => setTargetRent(value)}
                max={currentRent}
                min={500}
                step={25}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-20">
                {formatCurrency(targetRent)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Affordability Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Status */}
        <Card className="p-4">
          <div className="text-center space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">CURRENT SITUATION</h4>
              <div className="text-3xl font-bold mt-1">{formatPercentage(calculations.currentPercentage)}</div>
              <div className="text-sm text-muted-foreground">of income</div>
            </div>
            
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={calculations.currentPercentage <= 30 ? '#10b981' : calculations.currentPercentage <= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(calculations.currentPercentage, 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {calculations.currentPercentage <= 30 ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : calculations.currentPercentage <= 40 ? (
                  <Target className="h-6 w-6 text-yellow-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>

            <div className={`p-3 rounded-lg ${calculations.currentZone.bgColor}`}>
              <div className={`text-sm font-medium ${calculations.currentZone.textColor}`}>
                {calculations.overBudget ? 
                  `${formatCurrency(currentRent - calculations.recommendedMax)} over recommended budget` :
                  `${formatCurrency(calculations.recommendedMax - currentRent)} under budget`
                }
              </div>
            </div>
          </div>
        </Card>

        {/* Target Status */}
        <Card className="p-4">
          <div className="text-center space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">AFTER NEGOTIATION</h4>
              <div className="text-3xl font-bold mt-1">{formatPercentage(calculations.targetPercentage)}</div>
              <div className="text-sm text-muted-foreground">of income</div>
            </div>
            
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={calculations.targetPercentage <= 30 ? '#10b981' : calculations.targetPercentage <= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="2"
                  strokeDasharray={`${Math.min(calculations.targetPercentage, 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-green-500" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50">
              <div className="text-sm font-medium text-green-700">
                Improvement: {formatPercentage(calculations.currentPercentage - calculations.targetPercentage)} less
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Savings Impact */}
      {calculations.savingsImpact && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <PiggyBank className="h-5 w-5 text-green-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 mb-2">Potential Savings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(calculations.monthlySavings)}</div>
                  <div className="text-sm text-green-600">Per Month</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(calculations.annualSavings)}</div>
                  <div className="text-sm text-green-600">Per Year</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(calculations.annualSavings * 5)}</div>
                  <div className="text-sm text-green-600">Over 5 Years</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">💡 Negotiation Talking Points</h4>
        <div className="space-y-3">
          {calculations.overBudget && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <div className="font-medium">Financial Strain Argument</div>
                <div>"I'm currently paying {formatPercentage(calculations.currentPercentage)} of my income in rent, which exceeds the recommended 30%. This impacts my financial stability."</div>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <div className="font-medium">Specific Target Request</div>
              <div>"To align with financial best practices, I'd like to discuss reducing rent to {formatCurrency(targetRent)}, which would be {formatPercentage(calculations.targetPercentage)} of my income."</div>
            </div>
          </div>

          {calculations.savingsImpact && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <PiggyBank className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium">Long-term Stability</div>
                <div>"This adjustment would save me {formatCurrency(calculations.annualSavings)} annually, helping me build an emergency fund and be a more financially stable tenant."</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {calculations.currentPercentage > 30 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTargetRent(Math.round(calculations.recommendedMax))}
            >
              Set to 30% Rule
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTargetRent(Math.round(currentRent * 0.95))}
          >
            5% Reduction
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTargetRent(Math.round(currentRent * 0.9))}
          >
            10% Reduction
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AffordabilityCalculator;