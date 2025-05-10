
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const ProgramInfoCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About These Programs</CardTitle>
        <CardDescription>
          Information to help you navigate assistance options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Program Types</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Down payment assistance comes in various forms, including grants, forgivable loans, deferred loans, and more.
          </p>
        </div>
        <div>
          <h3 className="font-medium">Eligibility</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Many programs are designed for first-time homebuyers or those who haven't owned a home in the past three years.
          </p>
        </div>
        <div>
          <h3 className="font-medium">Application Tips</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
            <li>Apply early - funds can be limited</li>
            <li>Complete required homebuyer education</li>
            <li>Work with lenders familiar with these programs</li>
            <li>Be prepared to provide income documentation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramInfoCard;
