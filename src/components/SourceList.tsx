
import { useState } from "react";
import { ExternalSource, knowledgeBaseService } from "@/utils/knowledgeBase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Globe, Database, RefreshCw, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceListProps {
  sources: ExternalSource[];
  onRefresh: () => void;
}

export const SourceList = ({ sources, onRefresh }: SourceListProps) => {
  const [loadingSources, setLoadingSources] = useState<Record<string, boolean>>({});
  
  const handleDelete = async (id: string) => {
    try {
      const deleted = knowledgeBaseService.deleteSource(id);
      if (deleted) {
        toast({
          title: "Source deleted",
          description: "The source has been removed from your knowledge base.",
        });
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting source:", error);
      toast({
        title: "Error",
        description: "Failed to delete source. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleFetch = async (id: string) => {
    setLoadingSources(prev => ({ ...prev, [id]: true }));
    try {
      const success = await knowledgeBaseService.fetchDataFromSource(id);
      if (success) {
        toast({
          title: "Data fetched",
          description: "Successfully fetched data from source and added to knowledge base.",
        });
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch data from source. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data from source. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSources(prev => ({ ...prev, [id]: false }));
    }
  };
  
  const renderSourceIcon = (type: ExternalSource['type']) => {
    return type === 'marketData' ? 
      <Database className="h-4 w-4 mr-2" /> : 
      <Globe className="h-4 w-4 mr-2" />;
  };
  
  const getStatusBadge = (status: ExternalSource['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><RefreshCw className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return null;
    }
  };
  
  if (sources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No sources added yet. Add a source to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <Card key={source.id} className={cn(
          "transition-all duration-200",
          source.status === 'active' ? "border-green-200" : 
          source.status === 'error' ? "border-red-200" : "border-yellow-200"
        )}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center">
                  {renderSourceIcon(source.type)}
                  {source.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline truncate block max-w-[250px] sm:max-w-none"
                  >
                    {source.url}
                  </a>
                </CardDescription>
              </div>
              {getStatusBadge(source.status)}
            </div>
          </CardHeader>
          
          <CardContent>
            {source.description && (
              <p className="text-sm text-muted-foreground">{source.description}</p>
            )}
            {source.lastFetched && (
              <p className="text-xs text-muted-foreground mt-2">
                Last fetched: {new Date(source.lastFetched).toLocaleString()}
              </p>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDelete(source.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleFetch(source.id)}
              disabled={loadingSources[source.id]}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", loadingSources[source.id] && "animate-spin")} />
              {loadingSources[source.id] ? "Fetching..." : "Fetch Data"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
