
import { useState } from "react";
import { Header } from "@/components/Header";
import { NegotiationPractice } from "@/components/NegotiationPractice";

const Practice = () => {
  const [activeTab, setActiveTab] = useState("practice");
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 container py-6">
        <div className="h-[calc(100vh-9rem)]">
          <NegotiationPractice />
        </div>
      </main>
    </div>
  );
};

export default Practice;
