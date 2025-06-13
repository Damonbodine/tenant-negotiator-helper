import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/shared/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Check, Save, Mail, Copy, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Input } from "@/shared/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { DebugInfo } from "@/components/negotiation/DebugInfo";

// Define the schema for our form
const formSchema = z.object({
  goals: z.string().min(10, {
    message: "Goals must be at least 10 characters."
  }),
  propertyType: z.string().min(1, {
    message: "Property type is required"
  }),
  currentRent: z.string().min(1, {
    message: "Current rent is required"
  }),
  targetRent: z.string().optional(),
  marketInfo: z.string().optional(),
  additionalContext: z.string().optional()
});
type FormValues = z.infer<typeof formSchema>;

// Define the steps in our wizard
enum ScriptBuilderStep {
  Goals = 0,
  Details = 1,
  Script = 2,
  Email = 3,
  Practice = 4,
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

// Define the email template structure
interface EmailTemplate {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  signature: string;
  fullEmail: string;
}
const ScriptBuilder = () => {
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState<ScriptBuilderStep>(ScriptBuilderStep.Goals);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptResponse | null>(null);
  const [editedScript, setEditedScript] = useState<ScriptResponse | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<EmailTemplate | null>(null);
  const [savedScripts, setSavedScripts] = useState<{
    id: string;
    name: string;
    script: ScriptResponse;
  }[]>([]);
  const [scriptName, setScriptName] = useState("My Negotiation Script");
  const [debugSubmit, setDebugSubmit] = useState<{
    httpStatus: number | null;
    error: string | null;
    startTime: string | null;
    endTime: string | null;
    formState: string | null;
    validationTrigger: string | null;
  }>({
    httpStatus: null,
    error: null,
    startTime: null,
    endTime: null,
    formState: null,
    validationTrigger: null
  });
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: "",
      propertyType: "",
      currentRent: "",
      targetRent: "",
      marketInfo: "",
      additionalContext: ""
    },
    mode: "onSubmit" // Default, but explicitly set for clarity
  });
  console.log("Rendering ScriptBuilder, current step:", currentStep);
  console.log("Form state:", form.getValues());
  console.log("Form errors:", form.formState.errors);
  const nextStep = () => {
    console.log("Next step clicked, current step:", currentStep);
    if (currentStep < ScriptBuilderStep.Practice) {
      console.log("Moving to next step:", currentStep + 1);
      setCurrentStep(prev => prev + 1 as ScriptBuilderStep);
    }
  };
  const prevStep = () => {
    console.log("Prev step clicked, current step:", currentStep);
    if (currentStep > ScriptBuilderStep.Goals) {
      console.log("Moving to previous step:", currentStep - 1);
      setCurrentStep(prev => prev - 1 as ScriptBuilderStep);
    }
  };
  const generateScript = async (data: FormValues) => {
    setIsLoading(true);
    setDebugSubmit({
      ...debugSubmit,
      startTime: new Date().toISOString(),
      error: null,
      httpStatus: null
    });
    try {
      console.log("Sending data to script-generator:", data);
      const {
        data: response,
        error
      } = await supabase.functions.invoke('script-generator', {
        body: {
          goals: data.goals,
          propertyDetails: {
            propertyType: data.propertyType,
            currentRent: data.currentRent,
            targetRent: data.targetRent || ""
          },
          marketInfo: data.marketInfo || "",
          additionalContext: data.additionalContext || ""
        }
      });
      setDebugSubmit({
        ...debugSubmit,
        endTime: new Date().toISOString(),
        httpStatus: 200
      });
      if (error) {
        console.error("Error from script-generator:", error);
        setDebugSubmit({
          ...debugSubmit,
          error: JSON.stringify(error),
          httpStatus: error.status || 500
        });
        throw new Error(error.message);
      }
      console.log("Response from script-generator:", response);
      setGeneratedScript(response);
      setEditedScript(response);
      nextStep();
      toast({
        title: "Script generated",
        description: "Your negotiation script has been created successfully!"
      });
    } catch (error) {
      console.error("Error generating script:", error);
      setDebugSubmit({
        ...debugSubmit,
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : JSON.stringify(error)
      });
      toast({
        title: "Error",
        description: "Failed to generate negotiation script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmailTemplate = async () => {
    if (!editedScript) return;
    
    setIsGeneratingEmail(true);
    try {
      console.log("Generating email template from script:", editedScript);
      
      const { data: response, error } = await supabase.functions.invoke('script-generator', {
        body: {
          mode: 'email_template',
          script: editedScript,
          formData: form.getValues()
        }
      });

      if (error) {
        console.error("Error generating email template:", error);
        throw new Error(error.message);
      }

      console.log("Generated email template:", response);
      setGeneratedEmail(response);
      nextStep();
      
      toast({
        title: "Email template generated",
        description: "Your professional email template is ready!"
      });
    } catch (error) {
      console.error("Error generating email template:", error);
      toast({
        title: "Error",
        description: "Failed to generate email template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const copyEmailToClipboard = async () => {
    if (!generatedEmail?.fullEmail) return;
    
    try {
      await navigator.clipboard.writeText(generatedEmail.fullEmail);
      toast({
        title: "Email copied",
        description: "The email template has been copied to your clipboard!"
      });
    } catch (error) {
      console.error("Failed to copy email:", error);
      toast({
        title: "Copy failed",
        description: "Failed to copy email. Please select and copy manually.",
        variant: "destructive"
      });
    }
  };
  const saveScript = () => {
    if (!editedScript) return;
    const newScript = {
      id: Math.random().toString(36).substring(7),
      name: scriptName,
      script: editedScript
    };
    setSavedScripts(prev => [...prev, newScript]);
    toast({
      title: "Script saved",
      description: `"${scriptName}" has been saved successfully`
    });
  };

  // Simple direct navigation function for the Goals step - no validation
  const handleSkipValidation = () => {
    console.log("Skip validation button clicked, jumping to next step");
    nextStep();
  };

  // New handler for the Next button in the Goals step
  const handleGoalsNext = async () => {
    console.log("Goals Next button clicked - validating goals field");
    setDebugSubmit({
      ...debugSubmit,
      validationTrigger: "Goals Next Button - " + new Date().toISOString()
    });

    // Only validate the goals field
    const isGoalsValid = await form.trigger("goals");
    console.log("Goals validation result:", isGoalsValid);

    // Update debug info
    setDebugSubmit({
      ...debugSubmit,
      formState: JSON.stringify({
        values: form.getValues(),
        errors: form.formState.errors,
        isValid: isGoalsValid
      })
    });
    if (isGoalsValid) {
      console.log("Goals validation passed, moving to next step");
      nextStep();
    } else {
      console.log("Goals validation failed, staying on current step");
      toast({
        title: "Validation Error",
        description: "Please ensure your negotiation goals are at least 10 characters.",
        variant: "destructive"
      });
    }
  };
  const handleGoalsSubmit = (data: FormValues) => {
    console.log("Goals form submitted with data:", data);
    console.log("Form validation state:", form.formState);

    // For debugging only - this should not happen as we're using the button handler above
    console.log("WARNING: Form submission handler triggered instead of button handler");
    nextStep();
  };
  const renderFormStep = () => {
    switch (currentStep) {
      case ScriptBuilderStep.Goals:
        return <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>What are your negotiation goals?</CardTitle>
              <CardDescription>
                Describe what you want to achieve in this negotiation. For example: lower rent, fix maintenance issues, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGoalsSubmit)} className="space-y-6">
                  <FormField control={form.control} name="goals" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Negotiation Goals</FormLabel>
                        <FormControl>
                          <Textarea placeholder="I want to negotiate my rent down by $200 per month because similar units in the area are listed for less..." className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormDescription>
                          Be specific about what you want and why you think it's reasonable.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  <div className="flex justify-between">
                    {/* Development helper button - direct navigation */}
                    {showDebugInfo}
                    
                    {/* Changed from submit button to regular button with validation */}
                    <Button type="button" onClick={handleGoalsNext}>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>;
      case ScriptBuilderStep.Details:
        return <Card className="w-full max-w-3xl mx-auto">
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
                    <FormField control={form.control} name="propertyType" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1 bedroom apartment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="currentRent" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Current Rent</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., $1500/month" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                  
                  <FormField control={form.control} name="targetRent" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Target Rent (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $1300/month" {...field} />
                        </FormControl>
                        <FormDescription>
                          What's your ideal outcome? Leave blank if unsure.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="marketInfo" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Market Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Similar units in the area are renting for $1300-$1400, vacancy rates in the building are high..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Add any market data that strengthens your position.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="additionalContext" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Additional Context (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., I've been a tenant for 3 years with no late payments, I'm willing to sign a longer lease..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Any other information that might be relevant for the negotiation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>} />
                  
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating
                        </> : <>
                          Generate Script <ArrowRight className="ml-2 h-4 w-4" />
                        </>}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>;
      case ScriptBuilderStep.Script:
        return <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Negotiation Script</CardTitle>
                  <CardDescription>
                    Review and edit your personalized negotiation script below.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input className="w-64" placeholder="Script name" value={scriptName} onChange={e => setScriptName(e.target.value)} />
                  <Button onClick={saveScript}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editedScript && <div className="space-y-6">
                  <Tabs defaultValue="script" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="script">Script</TabsTrigger>
                      <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    </TabsList>
                    <TabsContent value="script" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">Introduction</h3>
                          <Textarea className="min-h-[100px]" value={editedScript.introduction} onChange={e => setEditedScript({
                        ...editedScript,
                        introduction: e.target.value
                      })} />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Main Points</h3>
                          {editedScript.mainPoints.map((point, i) => <div key={i} className="border rounded-md p-4 mb-4">
                              <h4 className="font-semibold mb-2">Point {i + 1}</h4>
                              <Textarea className="mb-2" value={point.point} onChange={e => {
                          const updatedPoints = [...editedScript.mainPoints];
                          updatedPoints[i] = {
                            ...point,
                            point: e.target.value
                          };
                          setEditedScript({
                            ...editedScript,
                            mainPoints: updatedPoints
                          });
                        }} />
                              <h4 className="font-semibold mb-2">Supporting Reasoning</h4>
                              <Textarea value={point.reasoning} onChange={e => {
                          const updatedPoints = [...editedScript.mainPoints];
                          updatedPoints[i] = {
                            ...point,
                            reasoning: e.target.value
                          };
                          setEditedScript({
                            ...editedScript,
                            mainPoints: updatedPoints
                          });
                        }} />
                            </div>)}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Objection Responses</h3>
                          {editedScript.objectionResponses.map((obj, i) => <div key={i} className="border rounded-md p-4 mb-4">
                              <h4 className="font-semibold mb-2">Potential Objection</h4>
                              <Textarea className="mb-2" value={obj.objection} onChange={e => {
                          const updatedObjs = [...editedScript.objectionResponses];
                          updatedObjs[i] = {
                            ...obj,
                            objection: e.target.value
                          };
                          setEditedScript({
                            ...editedScript,
                            objectionResponses: updatedObjs
                          });
                        }} />
                              <h4 className="font-semibold mb-2">Your Response</h4>
                              <Textarea value={obj.response} onChange={e => {
                          const updatedObjs = [...editedScript.objectionResponses];
                          updatedObjs[i] = {
                            ...obj,
                            response: e.target.value
                          };
                          setEditedScript({
                            ...editedScript,
                            objectionResponses: updatedObjs
                          });
                        }} />
                            </div>)}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Closing Statement</h3>
                          <Textarea className="min-h-[100px]" value={editedScript.closing} onChange={e => setEditedScript({
                        ...editedScript,
                        closing: e.target.value
                      })} />
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
                                  <div className="h-2 bg-blue-500 rounded-full" style={{
                                width: `${editedScript.feedback.persuasiveness * 10}%`
                              }} />
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
                                {editedScript.feedback.suggestions.map((suggestion, i) => <li key={i} className="text-sm text-gray-600">{suggestion}</li>)}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
              </Button>
              <Button onClick={generateEmailTemplate} disabled={isGeneratingEmail}>
                {isGeneratingEmail ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Email
                </> : <>
                  <Mail className="mr-2 h-4 w-4" /> Generate Email Template
                </>}
              </Button>
            </CardFooter>
          </Card>;
      case ScriptBuilderStep.Email:
        return <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Your Professional Email Template
                  </CardTitle>
                  <CardDescription>
                    Ready-to-send email based on your negotiation script
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={copyEmailToClipboard} variant="outline">
                    <Copy className="mr-2 h-4 w-4" /> Copy Email
                  </Button>
                  <Button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(generatedEmail?.subject || '')}&body=${encodeURIComponent(generatedEmail?.fullEmail || '')}`)}>
                    <Send className="mr-2 h-4 w-4" /> Open in Email App
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {generatedEmail && <div className="space-y-6">
                  <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email">Email Template</TabsTrigger>
                      <TabsTrigger value="components">Edit Components</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="email" className="space-y-4">
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-3">
                          <div className="text-sm text-gray-500">Preview:</div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4 font-mono text-sm bg-white p-4 rounded border">
                            <div><strong>Subject:</strong> {generatedEmail.subject}</div>
                            <div className="border-t pt-4 whitespace-pre-wrap">{generatedEmail.fullEmail}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="components" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">Subject Line</h3>
                          <Input 
                            value={generatedEmail.subject} 
                            onChange={e => setGeneratedEmail({
                              ...generatedEmail,
                              subject: e.target.value,
                              fullEmail: `${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}\n\n${generatedEmail.signature}`
                            })} 
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Greeting</h3>
                          <Input 
                            value={generatedEmail.greeting} 
                            onChange={e => setGeneratedEmail({
                              ...generatedEmail,
                              greeting: e.target.value,
                              fullEmail: `${e.target.value}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}\n\n${generatedEmail.signature}`
                            })} 
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Email Body</h3>
                          <Textarea 
                            className="min-h-[200px]" 
                            value={generatedEmail.body} 
                            onChange={e => setGeneratedEmail({
                              ...generatedEmail,
                              body: e.target.value,
                              fullEmail: `${generatedEmail.greeting}\n\n${e.target.value}\n\n${generatedEmail.closing}\n\n${generatedEmail.signature}`
                            })} 
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Closing</h3>
                          <Input 
                            value={generatedEmail.closing} 
                            onChange={e => setGeneratedEmail({
                              ...generatedEmail,
                              closing: e.target.value,
                              fullEmail: `${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${e.target.value}\n\n${generatedEmail.signature}`
                            })} 
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-2">Signature</h3>
                          <Input 
                            value={generatedEmail.signature} 
                            onChange={e => setGeneratedEmail({
                              ...generatedEmail,
                              signature: e.target.value,
                              fullEmail: `${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}\n\n${e.target.value}`
                            })} 
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Script
              </Button>
              <Button onClick={() => setCurrentStep(ScriptBuilderStep.Practice)}>
                Continue to Practice <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>;
      case ScriptBuilderStep.Practice:
        return <Card className="w-full max-w-4xl mx-auto">
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
                  
                  {savedScripts.length === 0 ? <p className="text-center text-gray-500 py-4">
                      No saved scripts yet. Save your script to access it later.
                    </p> : <div className="space-y-2">
                      {savedScripts.map(script => <div key={script.id} className="flex items-center justify-between p-3 border rounded-md">
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
                          description: `"${script.name}" has been removed`
                        });
                      }}>
                              Delete
                            </Button>
                          </div>
                        </div>)}
                    </div>}
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
          </Card>;
      default:
        return null;
    }
  };
  return <div className="container max-w-4xl py-12">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold mb-0">Email Script Builder</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Create personalized email templates to negotiate with your landlord professionally
        </p>
      </div>
      
      <div className="flex justify-center mb-8">
        <ul className="steps steps-horizontal w-full max-w-3xl">
          <li className={`step ${currentStep >= ScriptBuilderStep.Goals ? "step-primary" : ""}`}>Goals</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Details ? "step-primary" : ""}`}>Details</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Script ? "step-primary" : ""}`}>Script</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Email ? "step-primary" : ""}`}>Email</li>
          <li className={`step ${currentStep >= ScriptBuilderStep.Practice ? "step-primary" : ""}`}>Practice</li>
        </ul>
      </div>
      
      {/* Enhanced debug info component with form state details */}
      {showDebugInfo && <DebugInfo showDebugInfo={showDebugInfo} httpStatus={debugSubmit.httpStatus} requestStartTime={debugSubmit.startTime} requestEndTime={debugSubmit.endTime} rawErrorResponse={debugSubmit.error} additionalInfo={{
      formState: debugSubmit.formState,
      validationTrigger: debugSubmit.validationTrigger,
      currentStep: ScriptBuilderStep[currentStep]
    }} />}
      
      {renderFormStep()}
    </div>;
};
export default ScriptBuilder;