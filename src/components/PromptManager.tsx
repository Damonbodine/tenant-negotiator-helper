
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, ChevronRight, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PromptTemplate, chatService } from "@/utils/chatService";

export const PromptManager = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  const [newSubPrompt, setNewSubPrompt] = useState({ trigger: '', content: '' });

  // Load templates on component mount
  useEffect(() => {
    const loadedTemplates = chatService.getPromptTemplates();
    setTemplates(loadedTemplates);
    setActiveTemplateId(chatService.getActivePromptTemplateId());
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplateId(templateId);
    chatService.setActivePromptTemplate(templateId);
    
    toast({
      title: "Prompt Changed",
      description: "The AI will now use the selected prompt template",
    });
  };

  const handleAddTemplate = () => {
    setEditMode(false);
    setCurrentTemplate({
      id: '',
      name: '',
      systemPrompt: '',
      subPrompts: []
    });
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditMode(true);
    setCurrentTemplate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    chatService.deletePromptTemplate(templateId);
    const updatedTemplates = chatService.getPromptTemplates();
    setTemplates(updatedTemplates);
    setActiveTemplateId(chatService.getActivePromptTemplateId());
    
    toast({
      title: "Prompt Deleted",
      description: "The prompt template has been removed",
    });
  };

  const handleSaveTemplate = () => {
    if (!currentTemplate) return;
    
    if (!currentTemplate.name.trim() || !currentTemplate.systemPrompt.trim()) {
      toast({
        title: "Error",
        description: "Name and system prompt are required",
        variant: "destructive",
      });
      return;
    }
    
    if (editMode) {
      chatService.updatePromptTemplate(currentTemplate);
      toast({
        title: "Prompt Updated",
        description: "The prompt template has been updated",
      });
    } else {
      const { id, ...templateWithoutId } = currentTemplate;
      const newTemplate = chatService.addPromptTemplate(templateWithoutId);
      toast({
        title: "Prompt Created",
        description: "The new prompt template has been added",
      });
    }
    
    setCurrentTemplate(null);
    setTemplates(chatService.getPromptTemplates());
  };

  const handleAddSubPrompt = () => {
    if (!currentTemplate) return;
    
    if (!newSubPrompt.trigger.trim() || !newSubPrompt.content.trim()) {
      toast({
        title: "Error",
        description: "Trigger and content are required for sub-prompts",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentTemplate({
      ...currentTemplate,
      subPrompts: [
        ...(currentTemplate.subPrompts || []),
        {
          id: Date.now().toString(),
          trigger: newSubPrompt.trigger,
          content: newSubPrompt.content
        }
      ]
    });
    
    setNewSubPrompt({ trigger: '', content: '' });
  };

  const handleDeleteSubPrompt = (subPromptId: string) => {
    if (!currentTemplate) return;
    
    setCurrentTemplate({
      ...currentTemplate,
      subPrompts: currentTemplate.subPrompts?.filter(sp => sp.id !== subPromptId) || []
    });
  };

  return (
    <Card className="shadow-md border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
        <CardTitle>AI Prompt Manager</CardTitle>
        <CardDescription>
          Configure master prompts and specialized sub-prompts for the AI
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Available Templates</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={handleAddTemplate} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit Prompt Template' : 'Create New Prompt Template'}</DialogTitle>
                <DialogDescription>
                  Configure how the AI responds to different types of queries
                </DialogDescription>
              </DialogHeader>
              
              {currentTemplate && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Template Name</label>
                    <Input 
                      id="name" 
                      value={currentTemplate.name} 
                      onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                      placeholder="e.g., Rental Market Expert"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="systemPrompt" className="text-sm font-medium">Master Prompt</label>
                    <Textarea 
                      id="systemPrompt" 
                      value={currentTemplate.systemPrompt} 
                      onChange={(e) => setCurrentTemplate({...currentTemplate, systemPrompt: e.target.value})}
                      placeholder="Define the AI's personality, expertise, and goals..."
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Sub-Prompts</label>
                      <div className="text-xs text-muted-foreground">
                        These activate when their trigger words appear in the user's message
                      </div>
                    </div>
                    
                    <ScrollArea className={`${currentTemplate.subPrompts && currentTemplate.subPrompts.length > 0 ? 'h-[180px]' : 'h-auto'} rounded-md border p-4`}>
                      {currentTemplate.subPrompts && currentTemplate.subPrompts.length > 0 ? (
                        <div className="space-y-4">
                          {currentTemplate.subPrompts.map((subPrompt) => (
                            <div key={subPrompt.id} className="border rounded-md p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">Trigger: <span className="text-blue-600">"{subPrompt.trigger}"</span></div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteSubPrompt(subPrompt.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="text-sm text-muted-foreground">{subPrompt.content}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No sub-prompts defined yet. Add some below.
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="space-y-3 border-t pt-3 mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <Input 
                            placeholder="Trigger word" 
                            value={newSubPrompt.trigger}
                            onChange={(e) => setNewSubPrompt({...newSubPrompt, trigger: e.target.value})}
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex gap-2">
                            <Textarea 
                              placeholder="Sub-prompt content..." 
                              className="min-h-[60px]"
                              value={newSubPrompt.content}
                              onChange={(e) => setNewSubPrompt({...newSubPrompt, content: e.target.value})}
                            />
                            <Button 
                              variant="outline" 
                              className="h-full"
                              onClick={handleAddSubPrompt}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Example: Enter "pricing" as a trigger to activate specific guidance when users ask about rental pricing.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setCurrentTemplate(null)}>Cancel</Button>
                <Button onClick={handleSaveTemplate} className="gap-1">
                  <Save className="h-4 w-4" />
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-2">
          {templates.length > 0 ? (
            <div className="border rounded-md">
              <Accordion type="single" collapsible className="w-full">
                {templates.map((template) => (
                  <AccordionItem key={template.id} value={template.id}>
                    <div className={`flex items-center border-b px-4 py-2 ${template.id === activeTemplateId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <Button 
                        variant={template.id === activeTemplateId ? "default" : "outline"} 
                        size="sm"
                        className="mr-3"
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        {template.id === activeTemplateId ? "Active" : "Activate"}
                      </Button>
                      <AccordionTrigger className="font-medium hover:no-underline py-0 flex-1">
                        {template.name}
                      </AccordionTrigger>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {templates.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <AccordionContent className="p-4 bg-slate-50 dark:bg-slate-900/30">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Master Prompt:</h4>
                          <div className="text-sm text-muted-foreground bg-card p-3 rounded-md border">
                            {template.systemPrompt}
                          </div>
                        </div>
                        
                        {template.subPrompts && template.subPrompts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Sub-Prompts ({template.subPrompts.length}):</h4>
                            <div className="space-y-2">
                              {template.subPrompts.map((subPrompt) => (
                                <div key={subPrompt.id} className="text-sm text-muted-foreground bg-card p-3 rounded-md border">
                                  <span className="font-medium">Trigger:</span> "{subPrompt.trigger}" 
                                  <ChevronRight className="inline h-3 w-3 mx-1" />
                                  {subPrompt.content}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No prompt templates found. Create one to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
