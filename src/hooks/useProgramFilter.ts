
import { useState, useEffect } from "react";
import { DownPaymentProgram, getFilteredPrograms } from "@/data/downPaymentPrograms";

interface UseProgramFilterProps {
  selectedState: string;
  searchQuery: string;
  sortOption: string;
  showFirstTimeOnly: boolean;
}

export const useProgramFilter = ({
  selectedState,
  searchQuery,
  sortOption,
  showFirstTimeOnly
}: UseProgramFilterProps) => {
  const [filteredPrograms, setFilteredPrograms] = useState<DownPaymentProgram[]>([]);
  
  useEffect(() => {
    // Filter programs based on selected state
    let filtered = getFilteredPrograms(selectedState);
    
    // Filter by first-time homebuyer programs if selected
    if (showFirstTimeOnly) {
      filtered = filtered.filter(program => program.firstTimeOnly);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(program => 
        program.name.toLowerCase().includes(query) || 
        program.eligibilityRequirements.toLowerCase().includes(query) ||
        program.benefits.toLowerCase().includes(query) ||
        program.agencyName.toLowerCase().includes(query)
      );
    }
    
    // Sort programs
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "state":
          return a.state.localeCompare(b.state);
        case "agency":
          return a.agencyName.localeCompare(b.agencyName);
        default:
          return 0;
      }
    });
    
    setFilteredPrograms(filtered);
  }, [selectedState, searchQuery, sortOption, showFirstTimeOnly]);

  return filteredPrograms;
};
