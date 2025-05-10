
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { getAllStates } from "@/data/downPaymentPrograms";

interface ProgramFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  showFirstTimeOnly: boolean;
  setShowFirstTimeOnly: (show: boolean) => void;
  totalPrograms: number;
}

const ProgramFilters = ({
  searchQuery,
  setSearchQuery,
  selectedState,
  setSelectedState,
  sortOption,
  setSortOption,
  showFirstTimeOnly,
  setShowFirstTimeOnly,
  totalPrograms
}: ProgramFiltersProps) => {
  const states = getAllStates();
  
  return (
    <>
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
        <div className="flex gap-2">
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All States">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="state">State</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant={showFirstTimeOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFirstTimeOnly(!showFirstTimeOnly)}
          className="flex items-center gap-1"
        >
          {showFirstTimeOnly ? "All Programs" : "First-Time Buyers"}
        </Button>
        <span className="text-sm text-muted-foreground">
          Showing {totalPrograms} programs
        </span>
      </div>
    </>
  );
};

export default ProgramFilters;
