
import { ApartmentAnalysis } from "@/components/negotiation/ApartmentAnalysis";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building, LinkIcon, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const Practice = () => {
  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Rent Analysis</h2>
            <p className="text-muted-foreground mt-1">
              Analyze apartment pricing to strengthen your negotiation position
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ApartmentAnalysis />
          </div>
          
          <div className="space-y-6">
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>Why Analyze Rentals?</CardTitle>
                <CardDescription>
                  Data-driven negotiation starts with market research
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Enter a Rental Listing</h3>
                      <p className="text-sm text-muted-foreground">Paste the URL of any rental listing to get started</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Building className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Compare with Similar Rentals</h3>
                      <p className="text-sm text-muted-foreground">See how the price compares to similar apartments in the area</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <ExternalLink className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Get Negotiation Advice</h3>
                      <p className="text-sm text-muted-foreground">Receive tailored negotiation strategies based on market analysis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>Negotiation Tips</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  <li className="text-sm">• Know market rates before negotiating</li>
                  <li className="text-sm">• Mention comparable units in your area</li>
                  <li className="text-sm">• Be prepared to justify your counteroffer</li>
                  <li className="text-sm">• Ask for concessions beyond just rent</li>
                  <li className="text-sm">• Consider offering a longer lease term</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
