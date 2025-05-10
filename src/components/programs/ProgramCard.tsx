
import { ExternalLink, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { DownPaymentProgram } from "@/data/downPaymentPrograms";

interface ProgramCardProps {
  program: DownPaymentProgram;
}

const ProgramCard = ({ program }: ProgramCardProps) => {
  return (
    <Card className="overflow-hidden border-l-4 border-l-purple-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{program.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{program.agencyName}</span>
              <Badge variant="outline">{program.state}</Badge>
              {program.firstTimeOnly && (
                <Badge className="bg-purple-600">First-Time Buyers</Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Eligibility</h4>
            <p className="mt-1">{program.eligibilityRequirements}</p>
            {program.incomeLimit && (
              <p className="text-sm mt-1">Income Limit: {program.incomeLimit}</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Benefits</h4>
            <p className="mt-1">{program.benefits}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {program.link && (
          <Button variant="outline" asChild className="mt-2">
            <a href={program.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              Visit Program Website
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;
