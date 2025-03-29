
import { NegotiationPractice } from "@/components/NegotiationPractice";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Practice = () => {
  const location = useLocation();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    
    if (tabParam === "analysis") {
      // Find the analysis tab and click it
      const analysisTab = document.querySelector('[value="analysis"]') as HTMLElement;
      if (analysisTab) {
        analysisTab.click();
      }
    }
  }, [location]);
  
  return (
    <div className="container py-6">
      <NegotiationPractice />
    </div>
  );
};

export default Practice;
