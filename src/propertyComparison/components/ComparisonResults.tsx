
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyComparisonResponse } from "@/shared/types/comparison";
import { Skeleton } from "@/shared/ui/skeleton";

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
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
              {comparison.properties.map((property, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Address</td>
              {comparison.properties.map((property, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.address}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Price</td>
              {comparison.properties.map((property, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${property.price?.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bedrooms</td>
              {comparison.properties.map((property, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.bedrooms}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bathrooms</td>
              {comparison.properties.map((property, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.bathrooms}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Square Footage</td>
              {comparison.properties.map((property, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.squareFootage ? property.squareFootage.toLocaleString() : "N/A"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Price per Sq Ft</td>
              {comparison.properties.map((property, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {property.price && property.squareFootage 
                    ? `$${(property.price / property.squareFootage).toFixed(2)}` 
                    : "N/A"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
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
