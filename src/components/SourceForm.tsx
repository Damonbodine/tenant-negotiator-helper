import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalSource, knowledgeBaseService } from "@/utils/knowledgeBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const sourceSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  type: z.enum(["website", "marketData"], { 
    required_error: "Please select a source type" 
  }),
  description: z.string().optional(),
});

type SourceFormValues = z.infer<typeof sourceSchema>;

interface SourceFormProps {
  onSourceAdded?: (source: ExternalSource) => void;
}

export const SourceForm = ({ onSourceAdded }: SourceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SourceFormValues>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "marketData",
      description: "",
    },
  });

  const onSubmit = async (values: SourceFormValues) => {
    setIsSubmitting(true);
    try {
      // Add the new source to our knowledge base - ensuring all required fields are present
      const newSource = knowledgeBaseService.addSource({
        name: values.name,
        url: values.url,
        type: values.type,
        description: values.description || ""
      });
      
      toast({
        title: "Source added",
        description: `${values.name} has been added to your knowledge sources.`,
      });
      
      // Reset the form
      form.reset();
      
      // Notify parent component
      if (onSourceAdded) {
        onSourceAdded(newSource);
      }
    } catch (error) {
      console.error("Error adding source:", error);
      toast({
        title: "Error",
        description: "Failed to add source. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  
  return (
    <div className="p-4 bg-card border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Add Knowledge Source</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Name</FormLabel>
                <FormControl>
                  <Input placeholder="NYC Rent Guidelines" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/rent-data" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the full URL including https://
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="marketData">Market Data</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of this source" 
                    {...field} 
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Source..." : "Add Source"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
