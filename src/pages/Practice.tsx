
import { useState } from "react";
import { NegotiationPractice } from "@/components/NegotiationPractice";
import { Building } from "lucide-react";
import { Link } from "react-router-dom";

const Practice = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#da7756]">
      <header className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container flex items-center justify-between">
          <div className="flex-1">
            <Link to="/" className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-600">
              Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-blue-600">RentCoach</h1>
          </div>
          <div className="flex-1"></div>
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Practice Negotiation Call</h2>
          <div className="h-[calc(100vh-10rem)]">
            <NegotiationPractice />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Practice;
