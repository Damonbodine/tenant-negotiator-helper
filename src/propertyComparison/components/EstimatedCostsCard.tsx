
import React from "react";
import { PropertyDetails } from "@/shared/types/comparison";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EstimatedCostsCardProps {
  properties: PropertyDetails[];
  formatPrice: (price: number | null) => string;
}

export function EstimatedCostsCard({ properties, formatPrice }: EstimatedCostsCardProps) {
  if (!properties || properties.length < 2) return null;

  // Calculate estimated utility costs based on square footage
  // These are rough estimates for illustration purposes
  const calculateUtilities = (squareFootage: number): { electric: number; water: number; internet: number } => {
    return {
      electric: Math.round((squareFootage * 0.12) + 40), // Base + per sqft
      water: Math.round((squareFootage * 0.03) + 25),    // Base + per sqft
      internet: 60 // Fixed cost
    };
  };

  // Add up all estimated monthly costs
  const calculateTotalCost = (property: PropertyDetails): number => {
    if (!property.squareFootage || !property.price) return 0;
    
    const utilities = calculateUtilities(property.squareFootage);
    return property.price + utilities.electric + utilities.water + utilities.internet;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimated Monthly Costs</CardTitle>
        <CardDescription>
          Beyond just the rent, here's what you can expect to pay monthly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Expense</TableHead>
              {properties.map((_, index) => (
                <TableHead key={index}>Property {index + 1}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Rent</TableCell>
              {properties.map((property, index) => (
                <TableCell key={index}>{formatPrice(property.price)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Electric</TableCell>
              {properties.map((property, index) => (
                <TableCell key={index}>
                  {property.squareFootage 
                    ? formatPrice(calculateUtilities(property.squareFootage).electric)
                    : "N/A"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Water</TableCell>
              {properties.map((property, index) => (
                <TableCell key={index}>
                  {property.squareFootage 
                    ? formatPrice(calculateUtilities(property.squareFootage).water)
                    : "N/A"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Internet</TableCell>
              {properties.map((property, index) => (
                <TableCell key={index}>{formatPrice(60)}</TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell className="font-bold">Total</TableCell>
              {properties.map((property, index) => (
                <TableCell key={index} className="font-bold">
                  {property.squareFootage && property.price
                    ? formatPrice(calculateTotalCost(property))
                    : "N/A"}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
