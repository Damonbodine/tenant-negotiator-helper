
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SourceForm } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExternalSource, knowledgeBaseService } from "@/utils/knowledgeBase";
import { PlusCircle, Database, Globe } from "lucide-react";

export const KnowledgeManagement = () => {
  const [activeTab, setActiveTab] = useState<"all" | "marketData" | "website">("all");
  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  
  const fetchSources = () => {
    if (activeTab === "all") {
      setSources(knowledgeBaseService.getAllSources());
    } else {
      setSources(knowledgeBaseService.getSourcesByType(activeTab));
    }
  };
  
  useEffect(() => {
    fetchSources();
  }, [activeTab]);
  
  const handleSourceAdded = () => {
    fetchSources();
    setIsAddSourceOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Sources</h2>
          <p className="text-muted-foreground mt-1">
            Manage external data sources to enhance your knowledge base
          </p>
        </div>
        
        <Sheet open={isAddSourceOpen} onOpenChange={setIsAddSourceOpen}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Knowledge Source</SheetTitle>
              <SheetDescription>
                Add a new website or market data source to your knowledge base
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <SourceForm onSourceAdded={handleSourceAdded} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="all">All Sources</TabsTrigger>
          <TabsTrigger value="marketData" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Market Data
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Websites
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <SourceList sources={sources} onRefresh={fetchSources} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
