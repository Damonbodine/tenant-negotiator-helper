
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const MarketData = () => {
  const [city, setCity] = useState("new-york");
  const [chartType, setChartType] = useState("rent-prices");
  
  // Sample data - in a real app this would come from an API
  const rentData = {
    "new-york": [
      { name: "Studio", price: 2800, change: 5.2 },
      { name: "1 Bed", price: 3200, change: 4.8 },
      { name: "2 Bed", price: 4100, change: 3.9 },
      { name: "3 Bed", price: 5500, change: 2.5 }
    ],
    "san-francisco": [
      { name: "Studio", price: 2600, change: 3.1 },
      { name: "1 Bed", price: 3100, change: 2.8 },
      { name: "2 Bed", price: 4300, change: 1.9 },
      { name: "3 Bed", price: 5800, change: 1.2 }
    ],
    "chicago": [
      { name: "Studio", price: 1600, change: 2.5 },
      { name: "1 Bed", price: 1900, change: 2.1 },
      { name: "2 Bed", price: 2400, change: 1.8 },
      { name: "3 Bed", price: 3200, change: 1.5 }
    ]
  };
  
  const trendData = {
    "new-york": [
      { month: "Jan", value: 2700 },
      { month: "Feb", value: 2720 },
      { month: "Mar", value: 2750 },
      { month: "Apr", value: 2790 },
      { month: "May", value: 2830 },
      { month: "Jun", value: 2850 },
      { month: "Jul", value: 2800 },
      { month: "Aug", value: 2780 },
      { month: "Sep", value: 2760 },
      { month: "Oct", value: 2750 },
      { month: "Nov", value: 2800 },
      { month: "Dec", value: 2850 }
    ],
    "san-francisco": [
      { month: "Jan", value: 2500 },
      { month: "Feb", value: 2550 },
      { month: "Mar", value: 2570 },
      { month: "Apr", value: 2600 },
      { month: "May", value: 2620 },
      { month: "Jun", value: 2650 },
      { month: "Jul", value: 2630 },
      { month: "Aug", value: 2600 },
      { month: "Sep", value: 2580 },
      { month: "Oct", value: 2570 },
      { month: "Nov", value: 2600 },
      { month: "Dec", value: 2630 }
    ],
    "chicago": [
      { month: "Jan", value: 1500 },
      { month: "Feb", value: 1520 },
      { month: "Mar", value: 1550 },
      { month: "Apr", value: 1570 },
      { month: "May", value: 1600 },
      { month: "Jun", value: 1620 },
      { month: "Jul", value: 1600 },
      { month: "Aug", value: 1580 },
      { month: "Sep", value: 1550 },
      { month: "Oct", value: 1530 },
      { month: "Nov", value: 1560 },
      { month: "Dec", value: 1590 }
    ]
  };
  
  const vacancyData = {
    "new-york": [
      { category: "Downtown", value: 3.8 },
      { category: "Midtown", value: 4.2 },
      { category: "Uptown", value: 5.1 },
      { category: "Brooklyn", value: 6.7 },
      { category: "Queens", value: 7.2 }
    ],
    "san-francisco": [
      { category: "Downtown", value: 4.1 },
      { category: "SoMa", value: 4.5 },
      { category: "Mission", value: 3.9 },
      { category: "Richmond", value: 5.3 },
      { category: "Sunset", value: 6.1 }
    ],
    "chicago": [
      { category: "Loop", value: 5.2 },
      { category: "North Side", value: 6.3 },
      { category: "South Side", value: 8.1 },
      { category: "West Loop", value: 4.7 },
      { category: "Lincoln Park", value: 5.8 }
    ]
  };
  
  const cityOptions = [
    { value: "new-york", label: "New York" },
    { value: "san-francisco", label: "San Francisco" },
    { value: "chicago", label: "Chicago" }
  ];

  const getCurrentData = () => {
    switch (chartType) {
      case "rent-prices":
        return rentData[city as keyof typeof rentData];
      case "rent-trends":
        return trendData[city as keyof typeof trendData];
      case "vacancy-rates":
        return vacancyData[city as keyof typeof vacancyData];
      default:
        return [];
    }
  };
  
  const getDataFormatter = () => {
    switch (chartType) {
      case "rent-prices":
        return (value: number) => `$${value}`;
      case "rent-trends":
        return (value: number) => `$${value}`;
      case "vacancy-rates":
        return (value: number) => `${value}%`;
      default:
        return (value: number) => value.toString();
    }
  };
  
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={getCurrentData()}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={chartType === "rent-prices" ? "name" : "category"} 
          tick={{ fontSize: 12 }} 
        />
        <YAxis 
          tickFormatter={getDataFormatter()} 
          tick={{ fontSize: 12 }} 
          width={50} 
        />
        <Tooltip 
          formatter={getDataFormatter()} 
          labelFormatter={(label) => `${label}`} 
        />
        <Bar 
          dataKey={chartType === "rent-prices" ? "price" : "value"} 
          fill="#2b8aff" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
  
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={getCurrentData()}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }} 
        />
        <YAxis 
          tickFormatter={(value) => `$${value}`} 
          tick={{ fontSize: 12 }} 
          width={50} 
        />
        <Tooltip 
          formatter={(value) => [`$${value}`, "Average Rent"]} 
          labelFormatter={(label) => `${label}`} 
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#2b8aff" 
          activeDot={{ r: 8 }} 
          strokeWidth={2} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-heading">Rental Market Data</h2>
          <p className="text-muted-foreground mt-1">
            Current market insights to help with your negotiation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <TooltipProvider>
            <TooltipUI>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  This data represents average rental prices and trends. Use it as a reference point for your negotiations.
                </p>
              </TooltipContent>
            </TooltipUI>
          </TooltipProvider>
        </div>
      </div>
      
      <Tabs defaultValue="rent-prices" value={chartType} onValueChange={setChartType}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="rent-prices">Current Prices</TabsTrigger>
          <TabsTrigger value="rent-trends">12-Month Trend</TabsTrigger>
          <TabsTrigger value="vacancy-rates">Vacancy Rates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rent-prices" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Rental Prices</CardTitle>
              <CardDescription>
                Current average rental prices by unit type in {cityOptions.find(c => c.value === city)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderBarChart()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rent-trends" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">12-Month Rent Trend</CardTitle>
              <CardDescription>
                Average rental price for a one-bedroom apartment in {cityOptions.find(c => c.value === city)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderLineChart()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vacancy-rates" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Vacancy Rates</CardTitle>
              <CardDescription>
                Current vacancy rates by neighborhood in {cityOptions.find(c => c.value === city)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderBarChart()}
            </CardContent>
          </Card>
          
          <div className="mt-4 p-4 bg-negotiator-50 border border-negotiator-100 rounded-md">
            <h3 className="font-medium text-negotiator-800">Negotiation Tip:</h3>
            <p className="text-negotiator-700 mt-1">
              Higher vacancy rates give you more negotiating power. Properties in areas with vacancy rates above 5% are often more willing to negotiate on rent and terms.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
