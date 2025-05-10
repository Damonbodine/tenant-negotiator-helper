
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { ChevronLeft, Home, Search, ExternalLink } from "lucide-react";
import { downPaymentPrograms, getAllStates, getFilteredPrograms, DownPaymentProgram } from "@/data/downPaymentPrograms";

const DownPaymentPrograms = () => {
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState<DownPaymentProgram[]>([]);
  
  const states = getAllStates();
  
  useEffect(() => {
    // Filter programs based on selected state and search query
    let filtered = getFilteredPrograms(selectedState);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(program => 
        program.name.toLowerCase().includes(query) || 
        program.eligibilityRequirements.toLowerCase().includes(query) ||
        program.benefits.toLowerCase().includes(query) ||
        program.agencyName.toLowerCase().includes(query)
      );
    }
    
    setFilteredPrograms(filtered);
  }, [selectedState, searchQuery]);

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" asChild size="sm">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" />
                Back to Resources
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Down Payment Assistance Programs</h1>
          <p className="text-muted-foreground mt-2">
            Find programs that can help you afford your first home
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All States">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No programs found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>

        <div>
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
        </div>
      </div>
    </div>
  );
};

const ProgramCard = ({ program }: { program: DownPaymentProgram }) => {
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

export default DownPaymentPrograms;
