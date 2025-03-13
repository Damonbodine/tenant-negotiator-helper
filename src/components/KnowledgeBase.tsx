
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KnowledgeItem, knowledgeBaseService } from "@/utils/knowledgeBase";
import { Search } from "lucide-react";

export const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<KnowledgeItem["category"] | "all">("all");
  
  // Get items based on active filters
  const getFilteredItems = (): KnowledgeItem[] => {
    let items: KnowledgeItem[];
    
    // Filter by category if not "all"
    if (activeCategory !== "all") {
      items = knowledgeBaseService.getItemsByCategory(activeCategory);
    } else {
      items = knowledgeBaseService.getAllItems();
    }
    
    // If search query exists, filter further
    if (searchQuery.trim()) {
      return items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return items;
  };
  
  const filteredItems = getFilteredItems();
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 relative">
        <Input
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value as KnowledgeItem["category"] | "all")}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tactics">Tactics</TabsTrigger>
          <TabsTrigger value="marketData">Market Data</TabsTrigger>
          <TabsTrigger value="legalRights">Legal Rights</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeCategory} className="flex-1 mt-4">
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <div className="space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-1 mt-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{item.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No results found. Try adjusting your search.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
