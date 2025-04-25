
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, BookOpen } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Home className="h-5 w-5 text-blue-500" />
          <span>Renters Mentor</span>
        </Link>
        <nav className="ml-auto flex gap-2">
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              Practice
            </Button>
          </Link>
          <a href="/renters-playbook.pdf" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="gap-1">
              <BookOpen className="h-4 w-4" />
              Playbook
            </Button>
          </a>
        </nav>
      </div>
    </header>
  );
};
