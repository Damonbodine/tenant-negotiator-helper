
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PropertyComparisonResponse } from "@/shared/types/comparison";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { Link } from "@/shared/ui/link";

interface ComparisonResultsProps {
  comparison: PropertyComparisonResponse | null;
  isLoading: boolean;
}

export function ComparisonResults({ comparison, isLoading }: ComparisonResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Property Comparison Results</h2>
      
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-32">Feature</TableHead>
              {comparison.properties.map((property, index) => (
                <TableHead key={index}>
                  Property {index + 1} {comparison.bestValue === index && <span className="ml-2 text-green-600 font-semibold">(Best Value)</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Address</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.url ? (
                    <Link href={property.url} target="_blank" className="flex items-center hover:text-blue-600">
                      {property.address}
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </Link>
                  ) : (
                    property.address
                  )}
                </TableCell>
              ))}
            </TableRow>
            
            {/* Map Image Row */}
            <TableRow>
              <TableCell className="font-medium">Map</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.mapImageUrl ? (
                    <div className="relative w-full h-48 overflow-hidden rounded-md">
                      <img 
                        src={property.mapImageUrl} 
                        alt={`Map of ${property.address}`}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // If image fails to load, hide it
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Map not available</div>
                  )}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="font-medium">Price</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.price ? `$${property.price.toLocaleString()}/month` : "N/A"}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="font-medium">Bedrooms</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.bedrooms || "N/A"}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="font-medium">Bathrooms</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.bathrooms || "N/A"}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="font-medium">Square Footage</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.squareFootage ? `${property.squareFootage.toLocaleString()} sq ft` : "N/A"}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="font-medium">Price per Sq Ft</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.price && property.squareFootage 
                    ? `$${(property.price / property.squareFootage).toFixed(2)}/sq ft` 
                    : "N/A"}
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="font-medium">Zip Code</TableCell>
              {comparison.properties.map((property, index) => (
                <TableCell key={index}>
                  {property.zipCode || "N/A"}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Analysis</CardTitle>
          <CardDescription>AI-generated comparison of the properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: comparison.analysis }} />
        </CardContent>
      </Card>
    </div>
  );
}
