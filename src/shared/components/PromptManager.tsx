
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Save, ArrowLeft, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PromptTemplate } from '@/shared/types';

const PromptManager = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  useEffect(() => {
    // Load prompt templates
    try {
      const storedTemplates = localStorage.getItem('promptTemplates');
      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates));
      } else {
        // Set default templates
        const defaultTemplates = [
  {
    id: 'rental-agent',
    name: 'Renter AI Assistant',
    systemPrompt: `👋 Hi there! Excited to help with your apartment journey. Let's dive in.

**📈 Market Insight**
- Insert market trends here

**🛠️ Negotiation Tip**
- Insert a negotiation tip here

**🚀 Action Plan**
- Step 1
- Step 2
- Step 3

Format all responses with Markdown (**bold**, - bullets) and friendly emojis. Keep answers practical, empowering, and easy to scan.`
  }
];
        setTemplates(defaultTemplates);
        localStorage.setItem('promptTemplates', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Error loading prompt templates:', error);
    }
  }, []);
  
  const saveTemplates = (newTemplates: PromptTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('promptTemplates', JSON.stringify(newTemplates));
  };
  
  const addNewTemplate = () => {
    const newTemplate: PromptTemplate = {
      id: crypto.randomUUID(),
      name: 'New Template',
      systemPrompt: ''
    };
    setCurrentTemplate(newTemplate);
    setIsEditing(true);
  };
  
  const editTemplate = (template: PromptTemplate) => {
    setCurrentTemplate({...template});
    setIsEditing(true);
  };
  
  const saveTemplate = () => {
    if (!currentTemplate) return;
    
    if (templates.find(t => t.id === currentTemplate.id)) {
      // Update existing
      const updated = templates.map(t => t.id === currentTemplate.id ? currentTemplate : t);
      saveTemplates(updated);
    } else {
      // Add new
      saveTemplates([...templates, currentTemplate]);
    }
    
    setIsEditing(false);
    setCurrentTemplate(null);
  };
  
  const deleteTemplate = () => {
    if (!currentTemplate) return;
    
    const updated = templates.filter(t => t.id !== currentTemplate.id);
    saveTemplates(updated);
    setShowDeleteDialog(false);
    setIsEditing(false);
    setCurrentTemplate(null);
  };
  
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-muted-foreground mb-2 flex items-center hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Manager</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage prompts for your AI assistant
          </p>
        </div>
        <Button onClick={addNewTemplate}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>
      
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {templates.find(t => t.id === currentTemplate?.id) ? 'Edit Template' : 'New Template'}
            </CardTitle>
            <CardDescription>
              Configure the prompt template for your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input 
                id="name"
                value={currentTemplate?.name || ''}
                onChange={e => setCurrentTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea 
                id="system-prompt"
                value={currentTemplate?.systemPrompt || ''}
                onChange={e => setCurrentTemplate(prev => prev ? {...prev, systemPrompt: e.target.value} : null)}
                placeholder="Enter system prompt instructions for the AI"
                className="min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">
                This is the instruction that sets how the AI will behave and respond.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setCurrentTemplate(null);
                }}
              >
                Cancel
              </Button>
              {templates.find(t => t.id === currentTemplate?.id) && (
                <Button 
                  variant="destructive" 
                  className="ml-2"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
            <Button onClick={saveTemplate}>
              <Save className="mr-2 h-4 w-4" /> Save Template
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle>{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.systemPrompt}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 py-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="ml-auto"
                      onClick={() => editTemplate(template)}
                    >
                      <Pencil className="mr-2 h-3 w-3" /> Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.filter(t => t.id !== '1' && t.id !== '2').length > 0 ? 
                templates.filter(t => t.id !== '1' && t.id !== '2').map(template => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle>{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.systemPrompt}
                      </p>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/50 py-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="ml-auto"
                        onClick={() => editTemplate(template)}
                      >
                        <Pencil className="mr-2 h-3 w-3" /> Edit
                      </Button>
                    </CardFooter>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground mb-4">No custom templates yet</p>
                    <Button onClick={addNewTemplate}>
                      <Plus className="mr-2 h-4 w-4" /> Create Template
                    </Button>
                  </div>
                )
              }
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptManager;
