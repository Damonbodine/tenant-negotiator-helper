
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
      <div className="container flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4" />
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/34dcbc44-8a1c-4f73-8f2d-c65b665a74b8.png" 
            alt="RentCoach.ai Logo" 
            className="h-12 w-auto"
          />
          <h1 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">RentCoach.ai</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Button variant="outline" className="flex items-center gap-2 border-cyan-400/30 hover:bg-cyan-400/10">
            <Mail className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-400">Contact Us</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
