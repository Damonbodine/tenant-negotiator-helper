
import React, { useState } from "react";
import { PropertyDetails } from "@/shared/types/comparison";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChartPieIcon } from "lucide-react";

interface ScoringSystemProps {
  properties: PropertyDetails[];
  onScoreChange?: (bestValueIndex: number) => void;
}

export function ScoringSystem({ properties, onScoreChange }: ScoringSystemProps) {
  const [priceWeight, setPriceWeight] = useState(3);
  const [sizeWeight, setSizeWeight] = useState(2);
  const [roomsWeight, setRoomsWeight] = useState(1);
  
  if (!properties || properties.length < 2) return null;

  // Calculate scores based on user preferences
  const calculateScores = () => {
    const scores = properties.map(property => {
      // Price score - lower is better (inverse relationship)
      const priceScore = property.price ? 
        Math.max(1, 5 - (property.price / 1000)) * priceWeight : 0;
      
      // Size score - higher is better
      const sizeScore = property.squareFootage ?
        Math.min(5, property.squareFootage / 200) * sizeWeight : 0;
        
      // Rooms score - based on bedroom and bathroom count
      const roomScore = (property.bedrooms + property.bathrooms) * roomsWeight;
      
      // Total score
      const totalScore = priceScore + sizeScore + roomScore;
      
      return {
        priceScore,
        sizeScore,
        roomScore,
        totalScore
      };
    });
    
    // Find the best value based on total score
    const maxScoreIndex = scores.reduce(
      (maxIndex, score, index, array) => 
        score.totalScore > array[maxIndex].totalScore ? index : maxIndex, 
      0
    );
    
    if (onScoreChange) {
      onScoreChange(maxScoreIndex);
    }
    
    return scores;
  };
  
  const scores = calculateScores();
  const maxScoreIndex = scores.reduce(
    (maxIndex, score, index, array) => 
      score.totalScore > array[maxIndex].totalScore ? index : maxIndex, 
    0
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CardTitle>Personalized Scoring</CardTitle>
          <Badge variant="outline" className="ml-2">Beta</Badge>
        </div>
        <CardDescription>
          Adjust importance of factors to see which property best matches your priorities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Price Importance</label>
              <span className="text-sm">{priceWeight}/3</span>
            </div>
            <Slider 
              value={[priceWeight]} 
              min={1} 
              max={3} 
              step={1} 
              onValueChange={(values) => setPriceWeight(values[0])} 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Size Importance</label>
              <span className="text-sm">{sizeWeight}/3</span>
            </div>
            <Slider 
              value={[sizeWeight]} 
              min={1} 
              max={3} 
              step={1} 
              onValueChange={(values) => setSizeWeight(values[0])} 
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Room Count Importance</label>
              <span className="text-sm">{roomsWeight}/3</span>
            </div>
            <Slider 
              value={[roomsWeight]} 
              min={1} 
              max={3} 
              step={1} 
              onValueChange={(values) => setRoomsWeight(values[0])} 
            />
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="font-bold mb-2">Calculated Scores:</div>
            <div className="grid grid-cols-2 gap-4">
              {scores.map((score, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${maxScoreIndex === index ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Property {index + 1}</div>
                    <div className="text-lg font-bold">{score.totalScore.toFixed(1)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Price: {score.priceScore.toFixed(1)} | 
                    Size: {score.sizeScore.toFixed(1)} | 
                    Rooms: {score.roomScore.toFixed(1)}
                  </div>
                  {maxScoreIndex === index && (
                    <div className="flex items-center mt-2 text-green-600 dark:text-green-400 text-sm">
                      <ChartPieIcon className="h-4 w-4 mr-1" />
                      <span>Best match for your priorities</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
