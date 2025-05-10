
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ProgramCard from "@/components/programs/ProgramCard";
import ProgramFilters from "@/components/programs/ProgramFilters";
import ProgramPagination from "@/components/programs/ProgramPagination";
import ProgramInfoCard from "@/components/programs/ProgramInfoCard";
import { useProgramFilter } from "@/hooks/useProgramFilter";

const DownPaymentPrograms = () => {
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<string>("name");
  const [showFirstTimeOnly, setShowFirstTimeOnly] = useState<boolean>(false);
  
  // Use custom hook for filtering logic
  const filteredPrograms = useProgramFilter({
    selectedState,
    searchQuery,
    sortOption,
    showFirstTimeOnly
  });
  
  // Reset to first page when filters change
  const handleFiltersChange = (newState: string, newSort: string, newFirstTimeOnly: boolean) => {
    setSelectedState(newState);
    setSortOption(newSort);
    setShowFirstTimeOnly(newFirstTimeOnly);
    setCurrentPage(1);
  };
  
  // Calculate pagination
  const programsPerPage = 10;
  const indexOfLastProgram = currentPage * programsPerPage;
  const indexOfFirstProgram = indexOfLastProgram - programsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirstProgram, indexOfLastProgram);
  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <ProgramFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            sortOption={sortOption}
            setSortOption={setSortOption}
            showFirstTimeOnly={showFirstTimeOnly}
            setShowFirstTimeOnly={setShowFirstTimeOnly}
            totalPrograms={filteredPrograms.length}
          />

          {currentPrograms.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6">
                {currentPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
              
              <ProgramPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
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
          <ProgramInfoCard />
        </div>
      </div>
    </div>
  );
};

export default DownPaymentPrograms;
