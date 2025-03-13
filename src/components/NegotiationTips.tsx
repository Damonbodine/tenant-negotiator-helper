import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, Clock, DollarSign, FileText, Calendar, Wrench, Shield } from "lucide-react";

export const NegotiationTips = () => {
  const negotiationTips = [
    {
      id: "research",
      title: "Research the Market",
      icon: <FileText className="h-5 w-5 text-negotiator-500" />,
      content: "Before starting negotiations, research comparable properties in the area to understand the fair market value. Look at similar units in the same neighborhood to get a benchmark for rent prices.",
      steps: [
        "Search online rental listings for similar properties",
        "Visit at least 3-5 comparable properties in person",
        "Ask current residents about their rent if possible",
        "Check vacancy rates in the building and neighborhood"
      ]
    },
    {
      id: "timing",
      title: "Choose the Right Timing",
      icon: <Clock className="h-5 w-5 text-negotiator-500" />,
      content: "Timing can significantly impact your negotiating power. Winter months typically have less demand, potentially giving you more leverage. Properties vacant for 30+ days may be more flexible on price.",
      steps: [
        "Ask how long the unit has been vacant",
        "Negotiate at month's end when landlords feel pressure to fill units",
        "Look for winter move-in dates if possible",
        "Be prepared to move quickly during off-peak seasons"
      ]
    },
    {
      id: "lease-terms",
      title: "Negotiate Lease Length",
      icon: <Calendar className="h-5 w-5 text-negotiator-500" />,
      content: "Offering a longer lease term can be attractive to landlords and may give you leverage to negotiate a lower monthly rent. Many landlords prefer stable tenants who will stay for extended periods.",
      steps: [
        "Offer a 18-month or 24-month lease instead of 12 months",
        "Ask for a rent discount in exchange for a longer commitment",
        "Request a clause allowing you to sublet if needed",
        "Negotiate an option to renew at the same rate"
      ]
    },
    {
      id: "concessions",
      title: "Ask for Concessions",
      icon: <DollarSign className="h-5 w-5 text-negotiator-500" />,
      content: "Even if the rent price isn't negotiable, you can ask for other concessions such as free parking, waived amenity fees, or included utilities. These can significantly reduce your overall costs.",
      steps: [
        "Request one month free on a 12-month lease",
        "Ask for reduced security deposit",
        "Negotiate for free parking or storage space",
        "Request inclusion of utilities or internet in the rent"
      ]
    },
    {
      id: "improvements",
      title: "Request Improvements",
      icon: <Wrench className="h-5 w-5 text-negotiator-500" />,
      content: "If you notice issues with the property, you can negotiate to have them fixed before you move in or request upgrades as part of the deal. Document everything during your viewing.",
      steps: [
        "Take photos of issues during your viewing",
        "Create a specific list of requested repairs or upgrades",
        "Ask for new appliances or fixtures if current ones are outdated",
        "Get all promised improvements in writing before signing"
      ]
    },
    {
      id: "protection",
      title: "Secure Favorable Clauses",
      icon: <Shield className="h-5 w-5 text-negotiator-500" />,
      content: "The lease terms are often as important as the rent amount. Negotiate for clauses that protect you from unexpected rent increases or provide flexibility for life changes.",
      steps: [
        "Cap rent increases upon renewal",
        "Secure a early termination clause with reasonable terms",
        "Negotiate a right to sublet if needed",
        "Remove any excessive penalty fees or restrictive clauses"
      ]
    }
  ];
  
  const successFactors = [
    { factor: "Research", percentage: 85 },
    { factor: "Timing", percentage: 70 },
    { factor: "Confidence", percentage: 90 },
    { factor: "Flexibility", percentage: 65 },
    { factor: "Documentation", percentage: 80 }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-heading">Negotiation Strategies</h2>
        <p className="text-muted-foreground mt-1">
          Expert tips to help you secure a better rental deal
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Accordion type="single" collapsible className="w-full">
            {negotiationTips.map((tip) => (
              <AccordionItem value={tip.id} key={tip.id}>
                <AccordionTrigger className="hover:bg-negotiator-50 px-4 rounded-t-md">
                  <div className="flex items-center gap-2 text-left">
                    {tip.icon}
                    <span>{tip.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="mb-3 text-muted-foreground">{tip.content}</p>
                  <ul className="space-y-2">
                    {tip.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <BadgeCheck className="h-5 w-5 text-negotiator-500 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Success Factors</CardTitle>
              <CardDescription>
                Key elements that contribute to successful rental negotiations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {successFactors.map((factor) => (
                <div key={factor.factor} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{factor.factor}</span>
                    <span className="text-muted-foreground">{factor.percentage}%</span>
                  </div>
                  <Progress value={factor.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-negotiator-800 to-negotiator-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-negotiator-100">
                Always get agreements in writing. Verbal promises from landlords or property managers aren't legally binding in most cases. Follow up any verbal agreements with an email summary and make sure these terms are included in your lease.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Common Mistakes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">❌ Not doing research</span> - Negotiating without market knowledge weakens your position.
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">❌ Starting too high/low</span> - Unreasonable offers can end negotiations before they begin.
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">❌ Focusing only on rent</span> - Missing other valuable concessions like included utilities.
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">❌ Accepting first offers</span> - Most landlords expect some negotiation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
