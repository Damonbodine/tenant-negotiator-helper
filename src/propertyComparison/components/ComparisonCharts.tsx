
import React from "react";
import { PropertyDetails } from "@/shared/types/comparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface ComparisonChartsProps {
  properties: PropertyDetails[];
  formatPrice: (price: number | null) => string;
}

export function ComparisonCharts({ properties, formatPrice }: ComparisonChartsProps) {
  if (!properties || properties.length < 2) return null;
  
  // Prepare data for the price comparison chart
  const priceChartData = properties.map((property, index) => ({
    name: `Property ${index + 1}`,
    price: property.price || 0,
    pricePerSqFt: property.price && property.squareFootage 
      ? parseFloat((property.price / property.squareFootage).toFixed(2)) 
      : 0
  }));
  
  // Prepare data for the size comparison chart
  const sizeChartData = properties.map((property, index) => ({
    name: `Property ${index + 1}`,
    squareFootage: property.squareFootage || 0,
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priceChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value: any) => {
                    if (typeof value === 'number') {
                      return ['$' + value.toLocaleString()];
                    }
                    return [value];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="price" name="Monthly Rent" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="pricePerSqFt" name="Price per Sq Ft" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Size Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sizeChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="squareFootage" name="Square Footage" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="bedrooms" name="Bedrooms" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="bathrooms" name="Bathrooms" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
