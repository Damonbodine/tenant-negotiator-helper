import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/shared/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// Define the schema for our form
const formSchema = z.object({
  goals: z.string().min(10, {
    message: "Goals must be at least 10 characters.",
  }),
  propertyType: z.string().min(1, {
    message: "Property type is required",
  }),
  currentRent: z.string().min(1, {
    message: "Current rent is required",
  }),
  targetRent: z.string().optional(),
  marketInfo: z.string().optional(),
  additionalContext: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define the steps in our wizard
enum ScriptBuilderStep {
  Goals = 0,
  Details = 1,
  Script = 2,
  Practice = 3,
}

// Define the script structure returned by the AI
interface ScriptResponse {
  introduction: string;
  mainPoints: {
    point: string;
    reasoning: string;
  }[];
  objectionResponses: {
    objection: string;
    response: string;
  }[];
  closing: string;
  feedback: {
    persuasiveness: number;
    tone: string;
    suggestions: string[];
  };
}

const ScriptBuilder = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<ScriptBuilderStep>(ScriptBuilderStep.Goals);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptResponse | null>(null);
  const [editedScript, setEditedScript] = useState<ScriptResponse | null>(null);
  const [savedScripts, setSavedScripts] = useState<{ id: string; name: string; script: ScriptResponse }[]>([]);
  const [scriptName, setScriptName] = useState("My Negotiation Script");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: "",
      propertyType: "",
      currentRent: "",
      targetRent: "",
      marketInfo: "",
      additionalContext: "",
    },
  });

  const nextStep = () => {
    if (currentStep < ScriptBuilderStep.Practice) {
      setCurrentStep(prev => (prev + 1) as ScriptBuilderStep);
    }
  };

  const prevStep = () => {
    if (currentStep > ScriptBuilderStep.Goals) {
      setCurrentStep(prev => (prev - 1) as ScriptBuilderStep);
    }
  };

  const generateScript = async (data: FormValues) => {
    setIsLoading(true);
    try {
      console.log("Sending data to script-generator:", data);
      
      const { data: response, error } = await supabase.functions.invoke('script-generator', {
        body: { 
          goals: data.goals,
          propertyDetails: {
            propertyType: data.propertyType,
            currentRent: data.currentRent,
            targetRent: data.targetRent || "",
          },
          marketInfo: data.marketInfo || "",
          additionalContext: data.additionalContext || "",
        }
      });
      
      if (error) {
        console.error("Error from script-generator:", error);
        throw new Error(error.message);
      }
      
      console.log("Response from script-generator:", response);
      
      setGeneratedScript(response);
      setEditedScript(response);
      nextStep();
      
      toast({
        title: "Script generated",
        description: "Your negotiation script has been created successfully!",
      });
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error",
        description: "Failed to generate negotiation script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveScript = () => {
    if (!editedScript) return;
    
    const newScript = {
      id: Math.random().toString(36).substring(7),
      name: scriptName,
      script: editedScript,
    };
    
    setSavedScripts(prev => [...prev, newScript]);
    toast({
      title: "Script saved",
      description: `"${scriptName}" has been saved successfully`,
    });
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case ScriptBuilderStep.Goals:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>What are your negotiation goals?</CardTitle>
              <CardDescription>
                Describe what you want to achieve in this negotiation. For example: lower rent, fix maintenance issues, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(nextStep)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Negotiation Goals</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="I want to negotiate my rent down by $200 per month because similar units in the area are listed for less..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific about what you want and why you think it's reasonable.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit">
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        );
        
      case ScriptBuilderStep.Details:
        return (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Property & Market Details</CardTitle>
              <CardDescription>
                Add details about the property and market conditions to strengthen your negotiation position.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(generateScript)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1 bedroom apartment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currentRent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Rent</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., $1500/month" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="targetRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Rent (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $1300/month" {...field} />
                        </FormControl>
                        <FormDescription>
                          What's your ideal outcome? Leave blank if unsure.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="marketInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Market Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Similar units in the area are renting for $1300-$1400, vacancy rates in the building are high..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add any market data that strengthens your position.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Context (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., I've been a tenant for 3 years with no late payments, I'm willing to sign a longer lease..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Any other information that might be relevant for the negotiation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                        </>
                      ) : (
                        <>
                          Generate Script <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        );
        
      case ScriptBuilderStep.Script:
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Negotiation Script</CardTitle>
                  <CardDescription>
                    Review and edit your personalized negotiation script below.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-64"
                    placeholder="Script name" 
                    value={scriptName} 
                    onChange={(e) => setScriptName(e.target.value)} 
                  />
                  <Button onClick={saveScript}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editedScript && (
                <div className="space-y-6">
                  <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="script">Script</TabsTrigger>
                      <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    </TabsList>
                    <TabsContent value="script" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">Introduction</h3>
                          <Textarea 
                            className="min-h-[100px]"
                            value={editedScript.introduction}
                            onChange={(e) => setEditedScript({
                              ...editedScript,
                              introduction: e.target.value
                            })}
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Main Points</h3>
                          {editedScript.mainPoints.map((point, i) => (
                            <div key={i} className="border rounded-md p-4 mb-4">
                              <h4 className="font-semibold mb-2">Point {i+1}</h4>
                              <Textarea 
                                className="mb-2"
                                value={point.point}
                                onChange={(e) => {
                                  const updatedPoints = [...editedScript.mainPoints];
                                  updatedPoints[i] = { ...point, point: e.target.value };
                                  setEditedScript({
                                    ...editedScript,
                                    mainPoints: updatedPoints
                                  });
                                }}
                              />
                              <h4 className="font-semibold mb-2">Supporting Reasoning</h4>
                              <Textarea 
                                value={point.reasoning}
                                onChange={(e) => {
                                  const updatedPoints = [...editedScript.mainPoints];
                                  updatedPoints[i] = { ...point, reasoning: e.target.value };
                                  setEditedScript({
                                    ...editedScript,
                                    mainPoints: updatedPoints
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Objection Responses</h3>
                          {editedScript.objectionResponses.map((obj, i) => (
                            <div key={i} className="border rounded-md p-4 mb-4">
                              <h4 className="font-semibold mb-2">Potential Objection</h4>
                              <Textarea 
                                className="mb-2"
                                value={obj.objection}
                                onChange={(e) => {
                                  const updatedObjs = [...editedScript.objectionResponses];
                                  updatedObjs[i] = { ...obj, objection: e.target.value };
                                  setEditedScript({
                                    ...editedScript,
                                    objectionResponses: updatedObjs
                                  });
                                }}
                              />
                              <h4 className="font-semibold mb-2">Your Response</h4>
                              <Textarea 
                                value={obj.response}
                                onChange={(e) => {
                                  const updatedObjs = [...editedScript.objectionResponses];
                                  updatedObjs[i] = { ...obj, response: e.target.value };
                                  setEditedScript({
                                    ...editedScript,
                                    objectionResponses: updatedObjs
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Closing Statement</h3>
                          <Textarea 
                            className="min-h-[100px]"
                            value={editedScript.closing}
                            onChange={(e) => setEditedScript({
                              ...editedScript,
                              closing: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="feedback">
                      <Card>
                        <CardHeader>
                          <CardTitle>AI Feedback on Your Script</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Persuasiveness Score</span>
                              <div className="flex items-center">
                                <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                                  <div 
                                    className="h-2 bg-blue-500 rounded-full" 
                                    style={{ width: `${editedScript.feedback.persuasiveness * 10}%` }}
                                  />
                                </div>
                                <span>{editedScript.feedback.persuasiveness}/10</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Tone Analysis</span>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {editedScript.feedback.tone}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                The tone of your script is balanced and appropriate for a negotiation.
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <span className="font-medium">Improvement Suggestions</span>
                              <ul className="space-y-1 list-disc pl-5">
                                {editedScript.feedback.suggestions.map((suggestion, i) => (
                                  <li key={i} className="text-sm text-gray-600">{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
              </Button>
              <Button onClick={() => setCurrentStep(ScriptBuilderStep.Practice)}>
                Practice Script <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
        
      case ScriptBuilderStep.Practice:
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Practice Your Negotiation</CardTitle>
              <CardDescription>
                Role-play your negotiation with our AI landlord to practice your script.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-center p-12">
                  <p className="text-lg text-center">
                    Practice mode coming soon! In the meantime, you can review and edit your script in the previous step.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-bold text-lg mb-4">Saved Scripts</h3>
                  
                  {savedScripts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No saved scripts yet. Save your script to access it later.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {savedScripts.map(script => (
                        <div key={script.id} className="flex items-center justify-between p-3 border rounded-md">
                          <span>{script.name}</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditedScript(script.script);
                              setCurrentStep(ScriptBuilderStep.Script);
                            }}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSavedScripts(prev => prev.filter(s => s.id !== script.id));
                              toast({
                                title: "Script deleted",
                                description: `"${script.name}" has been removed`,
                              });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(ScriptBuilderStep.Script)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Script
              </Button>
              <Button variant="default" onClick={() => {
                setCurrentStep(ScriptBuilderStep.Goals);
                form.reset();
                setGeneratedScript(null);
                setEditedScript(null);
              }}>
                <Check className="mr-2 h-4 w-4" /> Create New Script
              </Button>
            </CardFooter>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Negotiation Script Builder</h1>
        <p className="text-lg text-muted-foreground">
          Create a personalized script to help you negotiate with confidence
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <ul className="steps steps-horizontal w-full max-w-2xl">
          <li className={`step ${currentStep >= ScriptBuilderStep.Goals ? "step-primary" : ""}`}>Goals</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Details ? "step-primary" : ""}`}>Details</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Script ? "step-primary" : ""}`}>Script</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Practice ? "step-primary" : ""}`}>Practice</li>
        </ul>
      </div>
      
      {renderFormStep()}
    </div>
  );
};

export default ScriptBuilder;
