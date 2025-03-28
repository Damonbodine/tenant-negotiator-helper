
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourceForm } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { BulkSourceUpload } from "@/components/BulkSourceUpload";
import { knowledgeBaseService } from "@/utils/knowledgeBase";
import { useToast } from "@/components/ui/use-toast";

export const KnowledgeManagement = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [sources, setSources] = useState(knowledgeBaseService.getAllSources());
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { toast } = useToast();

  const handleSourceAdded = (source) => {
    setSources(knowledgeBaseService.getAllSources());
    toast({
      title: "Source Added",
      description: `"${source.name}" has been added to your knowledge base.`,
    });
    setActiveTab("list");
  };

  const handleDelete = (id) => {
    knowledgeBaseService.deleteSource(id);
    setSources(knowledgeBaseService.getAllSources());
    toast({
      title: "Source Deleted",
      description: "The source has been removed from your knowledge base.",
    });
  };

  const handleSourcesAdded = () => {
    setSources(knowledgeBaseService.getAllSources());
    setShowBulkUpload(false);
    toast({
      title: "Sources Added",
      description: "Multiple sources have been added to your knowledge base.",
    });
  };

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
        <CardTitle>Knowledge Management</CardTitle>
        <CardDescription>
          Add and manage your negotiation knowledge sources
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        {showBulkUpload ? (
          <div className="p-6">
            <BulkSourceUpload 
              onSourcesAdded={handleSourcesAdded}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-6 pb-2 border-b">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="list">Your Sources</TabsTrigger>
                  <TabsTrigger value="add">Add New</TabsTrigger>
                </TabsList>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowBulkUpload(true)}
                >
                  Bulk Upload
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <TabsContent value="list" className="h-full m-0">
                <div className="p-6">
                  <SourceList sources={sources} onRefresh={() => setSources(knowledgeBaseService.getAllSources())} />
                </div>
              </TabsContent>
              
              <TabsContent value="add" className="h-full m-0">
                <div className="p-6">
                  <SourceForm onSourceAdded={handleSourceAdded} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
