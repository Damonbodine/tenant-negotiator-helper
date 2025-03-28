
import { useState } from 'react';
import { Building, DollarSign, MessagesSquare, PieChart, Headphones } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { Link } from "react-router-dom";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const [showApiModal, setShowApiModal] = useState(false);
  
  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-negotiator-600" />
          <h1 className="text-xl font-bold gradient-heading">RentNegotiator</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
          <TabsList className="bg-negotiator-50/50 dark:bg-negotiator-900/20">
            <TabsTrigger value="chat" className="flex items-center gap-1 data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <MessagesSquare className="h-4 w-4" />
              <span>AI Agent</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-1 data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <PieChart className="h-4 w-4" />
              <span>Market Data</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-1 data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              <span>Negotiation Tips</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-1 data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <Building className="h-4 w-4" />
              <span>Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-1 data-[state=active]:bg-negotiator-500 data-[state=active]:text-white" asChild>
              <Link to="/practice">
                <Headphones className="h-4 w-4" />
                <span>Practice</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowApiModal(true)}
          className="text-sm"
        >
          Set API Key
        </Button>
        
        {showApiModal && <ApiKeyInput onClose={() => setShowApiModal(false)} />}
      </div>
      
      <div className="md:hidden container mt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-negotiator-50/50 dark:bg-negotiator-900/20">
            <TabsTrigger value="chat" className="data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <MessagesSquare className="h-4 w-4" />
              <span className="sr-only">AI Agent</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <PieChart className="h-4 w-4" />
              <span className="sr-only">Market Data</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              <span className="sr-only">Negotiation Tips</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-negotiator-500 data-[state=active]:text-white">
              <Building className="h-4 w-4" />
              <span className="sr-only">Knowledge Base</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
};
