
import { useState } from 'react';
import { Building, DollarSign, MessagesSquare, PieChart, Headphones, Key, LogOut, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const [showApiModal, setShowApiModal] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-blue-600">RentCoach</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
          <TabsList className="bg-blue-50/50 dark:bg-blue-900/20">
            <TabsTrigger value="chat" className="flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <MessagesSquare className="h-4 w-4" />
              <span>AI Agent</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <PieChart className="h-4 w-4" />
              <span>Market Data</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              <span>Negotiation Tips</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Building className="h-4 w-4" />
              <span>Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white" asChild>
              <Link to="/practice">
                <Headphones className="h-4 w-4" />
                <span>Practice</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowApiModal(true)}
            className="text-sm flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
          >
            <Key className="h-4 w-4" />
            <span>Manage API Keys</span>
          </Button>
          
          {isLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm"
              asChild
            >
              <Link to="/auth">
                <User className="h-4 w-4 mr-1" />
                <span>Sign In</span>
              </Link>
            </Button>
          )}
        </div>
        
        {showApiModal && <ApiKeyInput onClose={() => setShowApiModal(false)} />}
      </div>
      
      <div className="md:hidden container mt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-blue-50/50 dark:bg-blue-900/20">
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <MessagesSquare className="h-4 w-4" />
              <span className="sr-only">AI Agent</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <PieChart className="h-4 w-4" />
              <span className="sr-only">Market Data</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              <span className="sr-only">Negotiation Tips</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Building className="h-4 w-4" />
              <span className="sr-only">Knowledge Base</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="mt-2 flex justify-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowApiModal(true)}
            className="text-sm flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
          >
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </Button>
          
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : user ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="text-sm flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm flex items-center gap-1"
              asChild
            >
              <Link to="/auth">
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
